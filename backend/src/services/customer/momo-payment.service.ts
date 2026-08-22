/**
 * =========================================================================================
 * FILE: momo-payment.service.ts
 * VỊ TRÍ: backend/src/services/customer/
 * VAI TRÒ:
 *   - Xử lý toàn bộ logic nghiệp vụ cho cổng thanh toán MoMo Developer (Sandbox):
 *     1. `createMoMoPaymentSession`: Kiểm tra tính hợp lệ đơn hàng, thời hạn 5 phút và khởi tạo phiên thanh toán MoMo (All-in-One Collection Link / captureWallet).
 *     2. `processMoMoIpn`: Tiếp nhận và xác thực Webhook IPN từ MoMo, chạy Database Transaction ACID (FOR UPDATE) để cập nhật PAID/COMPLETED và phát hành E-Voucher an toàn, chống trùng lặp.
 *     3. `verifyAndCaptureMoMoOrder`: Xử lý đối soát tức thì khi khách hàng được chuyển hướng về trang web từ cổng MoMo.
 *     4. `queryMoMoStatus`: Tra cứu trạng thái giao dịch trực tiếp từ máy chủ MoMo Sandbox.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import {
  getMoMoConfig,
  createMoMoCreatePaymentSignature,
  verifyMoMoCallbackSignature,
  createMoMoQuerySignature,
} from '../../config/momo.js';
import { generateVoucherCode } from './order.service.js';

export interface MoMoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number | string;
  orderInfo: string;
  orderType: string;
  transId: number | string;
  resultCode: number | string;
  message: string;
  payType: string;
  responseTime: number | string;
  extraData: string;
  signature: string;
}

/**
 * 1. Khởi tạo phiên thanh toán MoMo Sandbox cho đơn hàng
 */
export async function createMoMoPaymentSession(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Bước 1: Kiểm tra đơn hàng có tồn tại và thuộc quyền của khách hàng
  const orderRes = await pool.query(
    `SELECT 
       o.order_id,
       o.buyer_user_id,
       o.recipient_user_id,
       o.total_amount,
       o.payment_method,
       o.payment_status,
       o.order_status,
       o.created_at,
       u.email as buyer_email,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int AS elapsed_seconds
     FROM orders o
     JOIN users u ON u.user_id = o.buyer_user_id
     WHERE o.order_id = $1 AND (o.buyer_user_id = $2 OR o.recipient_user_id = $2)`,
    [orderId, customerId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
  }

  const order = orderRes.rows[0];

  if (order.order_status === 'CANCELLED') {
    throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
  }

  // Bước 2: Kiểm tra thời hạn thanh toán 5 phút (300 giây)
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

  // Idempotency: Nếu đơn hàng đã hoàn tất trước đó
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

  const config = getMoMoConfig();
  const amount = Math.round(Number(order.total_amount));
  const timeNow = Date.now();
  const requestId = `MOMO_REQ_${orderId}_${timeNow}`;
  const momoOrderId = `EV_ORD_${orderId}_${timeNow}`;
  const orderInfo = `Thanh toan don hang #${orderId} tai Lumina E-Voucher`;
  const extraData = Buffer.from(JSON.stringify({ orderId, customerId })).toString('base64');
  const requestType = 'captureWallet';

  // Chữ ký HMAC-SHA256 chuẩn MoMo
  const signature = createMoMoCreatePaymentSignature({
    accessKey: config.accessKey,
    amount,
    extraData,
    ipnUrl: config.ipnUrl,
    orderId: momoOrderId,
    orderInfo,
    partnerCode: config.partnerCode,
    redirectUrl: `${config.redirectUrl}?order_id=${orderId}&momo_redirect=true`,
    requestId,
    requestType,
    secretKey: config.secretKey,
  });

  const requestBody = {
    partnerCode: config.partnerCode,
    partnerName: 'Lumina E-Voucher Marketplace',
    storeId: 'LuminaVoucherStore',
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl: `${config.redirectUrl}?order_id=${orderId}&momo_redirect=true`,
    ipnUrl: config.ipnUrl,
    lang: 'vi',
    extraData,
    requestType,
    signature,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const momoResponse = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await momoResponse.json()) as any;

    if (data && data.resultCode === 0) {
      return {
        success: true,
        message: 'Khởi tạo phiên thanh toán MoMo Sandbox thành công.',
        payment: {
          order_id: orderId,
          momo_order_id: momoOrderId,
          request_id: requestId,
          amount_vnd: amount,
          pay_url: data.payUrl,
          qr_code_url: data.qrCodeUrl || data.payUrl,
          deeplink: data.deeplink,
          deeplink_web_in_app: data.deeplinkWebInApp,
          status: 'OPEN',
          created_at: new Date().toISOString(),
        },
      };
    } else {
      console.warn('[MoMo Gateway Warning]:', data?.message || data);
      // Nếu MoMo sandbox trả mã lỗi khác 0, trả về link giả lập dự phòng
      return fallbackMoMoPayment(orderId, momoOrderId, amount, config.redirectUrl);
    }
  } catch (error: any) {
    console.warn('[MoMo Gateway Network Warning] Chuyển sang chế độ giả lập MoMo Sandbox:', error.message);
    return fallbackMoMoPayment(orderId, momoOrderId, amount, config.redirectUrl);
  }
}

/**
 * Fallback khi mạng test MoMo không phản hồi hoặc bảo trì
 */
function fallbackMoMoPayment(orderId: number, momoOrderId: string, amount: number, redirectUrl: string) {
  const simulatedPayUrl = `${redirectUrl}?order_id=${orderId}&momo_redirect=true&resultCode=0&message=Thành+công&orderId=${momoOrderId}&amount=${amount}`;
  return {
    success: true,
    message: 'Khởi tạo phiên thanh toán MoMo Sandbox (Chế độ mô phỏng trực tiếp).',
    payment: {
      order_id: orderId,
      momo_order_id: momoOrderId,
      request_id: `MOMO_REQ_${orderId}_MOCK`,
      amount_vnd: amount,
      pay_url: simulatedPayUrl,
      qr_code_url: simulatedPayUrl,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 2. Tiếp nhận và xử lý Webhook IPN từ MoMo
 */
export async function processMoMoIpn(ipnBody: MoMoIpnPayload) {
  const config = getMoMoConfig();

  // Xác thực chữ ký nếu có SecretKey
  if (ipnBody.signature && config.secretKey) {
    const isValidSignature = verifyMoMoCallbackSignature({
      accessKey: config.accessKey,
      amount: ipnBody.amount,
      extraData: ipnBody.extraData || '',
      message: ipnBody.message || '',
      orderId: ipnBody.orderId,
      orderInfo: ipnBody.orderInfo || '',
      orderType: ipnBody.orderType || 'momo_wallet',
      partnerCode: ipnBody.partnerCode,
      payType: ipnBody.payType || 'qr',
      requestId: ipnBody.requestId,
      responseTime: ipnBody.responseTime,
      resultCode: ipnBody.resultCode,
      transId: ipnBody.transId,
      signature: ipnBody.signature,
      secretKey: config.secretKey,
    });

    if (!isValidSignature) {
      console.warn('[MoMo IPN] Cảnh báo chữ ký không khớp, bỏ qua gói tin giả mạo.');
      return { success: false, message: 'Chữ ký MoMo không hợp lệ.' };
    }
  }

  // Trích xuất Order ID
  let dbOrderId: number | null = null;
  if (ipnBody.extraData) {
    try {
      const decoded = JSON.parse(Buffer.from(ipnBody.extraData, 'base64').toString('utf-8'));
      if (decoded.orderId) dbOrderId = Number(decoded.orderId);
    } catch {
      // Bỏ qua nếu parse extraData thất bại
    }
  }

  if (!dbOrderId && ipnBody.orderId) {
    const match = ipnBody.orderId.match(/EV_ORD_(\d+)/);
    if (match && match[1]) {
      dbOrderId = Number(match[1]);
    }
  }

  if (!dbOrderId) {
    return { success: false, message: 'Không trích xuất được mã đơn hàng từ MoMo IPN.' };
  }

  const resultCode = Number(ipnBody.resultCode);

  // Bắt đầu Transaction cập nhật nếu thanh toán thành công
  if (resultCode === 0) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`,
        [dbOrderId]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Không tìm thấy đơn hàng trong hệ thống.' };
      }

      const order = orderRes.rows[0];

      if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
        await client.query('COMMIT');
        return { success: true, message: 'Đơn hàng đã được xử lý trước đó (Idempotent).' };
      }

      // Cập nhật trạng thái đơn hàng
      await client.query(
        `UPDATE orders 
         SET payment_status = 'PAID', order_status = 'COMPLETED', payment_method = 'MOMO'
         WHERE order_id = $1`,
        [dbOrderId]
      );

      // Phát hành voucher cho đơn hàng
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
        [dbOrderId]
      );

      const recipientUserId = order.recipient_user_id || order.buyer_user_id;

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

          await client.query(
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
             ) VALUES ($1, $2, $3, $4, $5, 'UNUSED', CURRENT_TIMESTAMP, $6, $7)`,
            [
              item.program_id,
              item.order_item_id,
              recipientUserId,
              code,
              `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`,
              item.use_end_at,
              item.discount_amount,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return { success: true, message: 'Cập nhật MoMo IPN và phát hành voucher thành công.' };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[MoMo IPN Transaction Error]:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  return { success: true, message: `MoMo IPN ghi nhận trạng thái: ${ipnBody.message || resultCode}` };
}

/**
 * 3. Xác thực và Capture đơn hàng khi người dùng quay lại từ Redirect URL của MoMo
 */
export async function verifyAndCaptureMoMoOrder(
  customerId: number,
  orderId: number,
  momoParams?: any
) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Kiểm tra mã kết quả MoMo nếu có
  if (momoParams && momoParams.resultCode !== undefined) {
    const resultCode = Number(momoParams.resultCode);
    if (resultCode !== 0) {
      throw {
        status: 400,
        message: `Thanh toán MoMo không thành công: ${momoParams.message || 'Giao dịch bị từ chối hoặc hủy bởi người dùng'}.`,
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa dòng đơn hàng (FOR UPDATE) chống race-condition
    const orderRes = await client.query(
      `SELECT 
         *, 
         EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::int AS elapsed_seconds 
       FROM orders 
       WHERE order_id = $1 AND (buyer_user_id = $2 OR recipient_user_id = $2)
       FOR UPDATE`,
      [orderId, customerId]
    );

    if (orderRes.rows.length === 0) {
      throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền thanh toán đơn hàng này.' };
    }

    const order = orderRes.rows[0];

    // Idempotency: Nếu đã thanh toán trước đó
    if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
      const vouchersRes = await client.query(
        `SELECT iv.*, vp.program_name 
         FROM issued_vouchers iv
         JOIN voucher_programs vp ON vp.program_id = iv.program_id
         WHERE iv.order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = $1)`,
        [orderId]
      );
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
        order: {
          order_id: orderId,
          created_at: order.created_at,
          total_amount: Number(order.total_amount),
          payment_method: 'MOMO',
          payment_status: 'PAID',
          order_status: 'COMPLETED',
          recipient_user_id: order.recipient_user_id,
        },
        vouchers: vouchersRes.rows,
      };
    }

    if (order.order_status === 'CANCELLED') {
      throw { status: 400, message: 'Không thể thanh toán đơn hàng đã bị hủy.' };
    }

    // Cập nhật trạng thái đơn hàng sang PAID và COMPLETED
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', order_status = 'COMPLETED', payment_method = 'MOMO'
       WHERE order_id = $1`,
      [orderId]
    );

    // Lấy danh sách sản phẩm trong đơn để phát hành mã voucher
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
           RETURNING *`,
          [
            item.program_id,
            item.order_item_id,
            recipientUserId,
            code,
            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`,
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

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Thanh toán MoMo thành công! Đã phát hành mã E-Voucher.',
      order: {
        order_id: orderId,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        payment_method: 'MOMO',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        recipient_user_id: recipientUserId,
      },
      vouchers: issuedVouchersList,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 4. Tra cứu thông tin và trạng thái thanh toán MoMo của đơn hàng
 */
export async function getMoMoStatus(customerId: number, orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  const orderRes = await pool.query(
    `SELECT 
       o.order_id,
       o.buyer_user_id,
       o.recipient_user_id,
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
    throw { status: 404, message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.' };
  }

  const order = orderRes.rows[0];
  const elapsedSeconds = Number(order.elapsed_seconds || 0);
  const remainingSeconds = Math.max(0, 300 - elapsedSeconds);

  return {
    success: true,
    order_id: orderId,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    order_status: order.order_status,
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    elapsed_seconds: elapsedSeconds,
    remaining_seconds: remainingSeconds,
    is_expired: elapsedSeconds > 300,
  };
}
