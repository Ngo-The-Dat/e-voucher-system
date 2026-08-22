/**
 * =========================================================================================
 * FILE: paypal-payment.service.ts
 * VỊ TRÍ: backend/src/services/customer/
 * VAI TRÒ:
 *   - Xử lý nghiệp vụ cổng thanh toán PayPal:
 *     1. `createPayPalOrder`: Khởi tạo thanh toán PayPal, quy đổi VND sang USD theo tỷ giá thời gian thực.
 *     2. `capturePayPalOrder`: Hoàn tất thanh toán, chuyển đơn sang PAID/COMPLETED và phát hành E-Voucher (ACID Transaction).
 *     3. `simulatePayPalScenario`: Giả lập các kịch bản kiểm thử (SUCCESS, DECLINED, INSUFFICIENT_FUNDS, CANCELLED).
 *     4. `getPayPalStatus`: Truy vấn trạng thái thanh toán và thông tin quy đổi USD của đơn hàng.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import crypto from 'node:crypto';
import { convertVndToUsd } from './exchange-rate.service.js';
import { generateVoucherCode } from './order.service.js';
import { createPayPalRestOrder, capturePayPalRestOrder } from '../../config/paypal.js';

export interface PayerInfoInput {
  email?: string;
  name?: string;
}

/**
 * 1. Khởi tạo giao dịch thanh toán PayPal cho đơn hàng
 */
export async function createPayPalOrder(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // 1. Kiểm tra đơn hàng có tồn tại và thuộc quyền của khách hàng
  const orderRes = await pool.query(
    `SELECT 
       order_id,
       buyer_user_id,
       recipient_user_id,
       total_amount,
       payment_method,
       payment_status,
       order_status,
       created_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::int AS elapsed_seconds
     FROM orders
     WHERE order_id = $1 AND (buyer_user_id = $2 OR recipient_user_id = $2)`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
  }

  const order = orderRes.rows[0];

  if (order.order_status === 'CANCELLED') {
    throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
  }

  // 2. Kiểm tra thời hạn thanh toán 5 phút (300 giây)
  const elapsedSeconds = Number(order.elapsed_seconds || 0);
  if (elapsedSeconds > 300) {
    await pool.query(
      `UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = $1`,
      [orderId]
    );
    throw {
      status: 400,
      message: 'Đơn hàng đã hết hạn thời gian thanh toán (5 phút). Vui lòng tạo lại đơn hàng mới.',
    };
  }

  if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
    return {
      success: true,
      message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
      payment: {
        order_id: orderId,
        status: 'COMPLETED',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        total_amount: Number(order.total_amount),
      },
    };
  }

  // 3. Quy đổi tỷ giá VND sang USD thời gian thực
  const totalAmountVnd = Number(order.total_amount);
  const conversion = await convertVndToUsd(totalAmountVnd);

  // 4. Tạo đơn hàng qua PayPal REST API v2 hoặc Fallback sang Mock Token
  const restOrder = await createPayPalRestOrder(orderId, conversion.amountUsd);

  const salt = crypto.randomBytes(3).toString('hex').toUpperCase();
  const timeHex = Date.now().toString(16).toUpperCase();
  const paypalOrderId = restOrder?.paypalOrderId || `PAYID-EV-${orderId}-${timeHex}-${salt}`;
  const approveUrl = restOrder?.approveUrl || `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`;

  return {
    success: true,
    message: 'Khởi tạo giao dịch thanh toán PayPal thành công.',
    payment: {
      order_id: orderId,
      paypal_order_id: paypalOrderId,
      amount_vnd: conversion.amountVnd,
      amount_usd: conversion.amountUsd,
      exchange_rate: conversion.exchangeRate,
      rate_source: conversion.rateSource,
      currency: 'USD',
      status: 'CREATED',
      approve_url: approveUrl,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 3. Hoàn tất (Capture) thanh toán PayPal và tự động phát hành E-Voucher trong Database Transaction
 */
export async function capturePayPalOrder(
  customerId: number,
  orderId: number,
  paypalOrderId?: string,
  _payerInfo?: PayerInfoInput
) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Nếu có paypalOrderId thực tế từ REST API Sandbox -> gọi capture trên PayPal API
  if (paypalOrderId && !paypalOrderId.startsWith('PAYID-EV-')) {
    await capturePayPalRestOrder(paypalOrderId);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa đơn hàng để tránh race condition
    const orderRes = await client.query(
      `SELECT 
         *, 
         EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::int AS elapsed_seconds 
       FROM orders 
       WHERE order_id = $1 AND buyer_user_id = $2 
       FOR UPDATE`,
      [orderId, customerId]
    );

    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
    }

    const order = orderRes.rows[0];

    if (order.order_status === 'CANCELLED') {
      throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
    }

    // Kiểm tra thời hạn 5 phút
    const elapsedSeconds = Number(order.elapsed_seconds || 0);
    if (elapsedSeconds > 300) {
      await client.query(
        `UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = $1`,
        [orderId]
      );
      await client.query('COMMIT');
      throw {
        status: 400,
        message: 'Đơn hàng đã hết hạn thời gian thanh toán (5 phút). Vui lòng tạo lại đơn hàng mới.',
      };
    }

    // Nếu đã thanh toán rồi (Idempotency)
    if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
        order: {
          order_id: orderId,
          created_at: order.created_at,
          total_amount: Number(order.total_amount),
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          recipient_user_id: order.recipient_user_id,
        },
      };
    }

    // Lấy các sản phẩm trong đơn
    const itemsRes = await client.query(
      `SELECT 
         oi.order_item_id,
         oi.program_id,
         oi.quantity,
         oi.unit_price,
         vp.program_name,
         vp.discount_amount,
         vp.use_end_at
       FROM order_items oi
       JOIN voucher_programs vp ON vp.program_id = oi.program_id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const recipientUserId = order.recipient_user_id || order.buyer_user_id;
    const issuedVouchersList: any[] = [];

    // Phát hành từng mã voucher
    for (const item of itemsRes.rows) {
      const quantity = Number(item.quantity);
      for (let i = 0; i < quantity; i++) {
        let code = generateVoucherCode();
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          const codeCheck = await client.query(
            `SELECT 1 FROM issued_vouchers WHERE voucher_code = $1`,
            [code]
          );
          if (codeCheck.rows.length === 0) {
            isUnique = true;
          } else {
            code = generateVoucherCode();
            attempts++;
          }
        }

        const voucherRes = await client.query(
          `INSERT INTO issued_vouchers (
             program_id,
             order_item_id,
             owner_user_id,
             voucher_code,
             qr_code,
             usage_status,
             issued_at,
             expires_at,
             discount_amount
           ) VALUES ($1, $2, $3, $4, $5, 'UNUSED', CURRENT_TIMESTAMP, $6, $7)
           RETURNING issued_voucher_id, voucher_code, qr_code, usage_status, issued_at, expires_at`,
          [
            item.program_id,
            item.order_item_id,
            recipientUserId,
            code,
            code,
            item.use_end_at,
            item.discount_amount,
          ]
        );

        issuedVouchersList.push({
          ...voucherRes.rows[0],
          program_name: item.program_name,
        });
      }
    }

    // Cập nhật trạng thái đơn hàng sang PAID và COMPLETED
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           order_status = 'COMPLETED',
           payment_method = 'PAYPAL'
       WHERE order_id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Thanh toán PayPal thành công. Voucher đã được phát hành.',
      order: {
        order_id: orderId,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        payment_method: 'PAYPAL',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        recipient_user_id: recipientUserId,
        vouchers: issuedVouchersList,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 4. Mô phỏng các kịch bản kiểm thử PayPal (Simulation)
 */
export async function simulatePayPalScenario(
  customerId: number,
  orderId: number,
  scenario: string,
  paypalOrderId?: string,
  payerInfo?: PayerInfoInput
) {
  const normalizedScenario = (scenario || 'SUCCESS').toUpperCase().trim();

  if (normalizedScenario === 'SUCCESS') {
    return capturePayPalOrder(customerId, orderId, paypalOrderId, payerInfo);
  }

  // Kiểm tra đơn hàng tồn tại
  const orderRes = await pool.query(
    `SELECT order_id, order_status FROM orders WHERE order_id = $1 AND buyer_user_id = $2`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng cần mô phỏng.' };
  }

  if (normalizedScenario === 'DECLINED') {
    throw {
      status: 400,
      error_code: 'PAYMENT_SOURCE_DECLINED_BY_PROCESSOR',
      message: 'Giao dịch thanh toán PayPal bị từ chối bởi ngân hàng phát hành (Mô phỏng).',
    };
  }

  if (normalizedScenario === 'INSUFFICIENT_FUNDS') {
    throw {
      status: 400,
      error_code: 'INSUFFICIENT_FUNDS',
      message: 'Tài khoản PayPal không đủ số dư để hoàn tất thanh toán (Mô phỏng).',
    };
  }

  if (normalizedScenario === 'EXPIRED' || normalizedScenario === 'CANCELLED') {
    throw {
      status: 400,
      error_code: 'PAYER_ACTION_REQUIRED_OR_CANCELLED',
      message: 'Giao dịch thanh toán PayPal đã bị người mua hủy bỏ hoặc hết hạn (Mô phỏng).',
    };
  }

  throw {
    status: 400,
    message: `Kịch bản mô phỏng "${scenario}" không hợp lệ. Các kịch bản hỗ trợ: SUCCESS, DECLINED, INSUFFICIENT_FUNDS, CANCELLED.`,
  };
}

/**
 * 5. Tra cứu trạng thái thanh toán PayPal của đơn hàng
 */
export async function getPayPalStatus(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  const orderRes = await pool.query(
    `SELECT 
       o.order_id,
       o.total_amount,
       o.payment_method,
       o.payment_status,
       o.order_status,
       o.created_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int AS elapsed_seconds
     FROM orders o
     WHERE o.order_id = $1 AND (o.buyer_user_id = $2 OR o.recipient_user_id = $2)`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng.' };
  }

  const order = orderRes.rows[0];
  const conversion = await convertVndToUsd(Number(order.total_amount));

  return {
    order_id: Number(order.order_id),
    total_amount_vnd: Number(order.total_amount),
    total_amount_usd: conversion.amountUsd,
    exchange_rate: conversion.exchangeRate,
    rate_source: conversion.rateSource,
    currency: 'USD',
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    order_status: order.order_status,
    elapsed_seconds: Math.max(0, Number(order.elapsed_seconds || 0)),
    created_at: order.created_at,
  };
}
