/**
 * =========================================================================================
 * FILE: zalopay-payment.service.ts
 * VỊ TRÍ: backend/src/services/customer/
 * VAI TRÒ:
 *   - Xử lý toàn bộ logic nghiệp vụ cho cổng thanh toán ZaloPay Sandbox v2:
 *     1. `createZaloPayOrder`: Khởi tạo đơn hàng thanh toán qua ZaloPay OpenAPI v2.
 *     2. `verifyAndCaptureZaloPayOrder`: Xác thực kết quả giao dịch và phát hành mã E-Voucher trong Database Transaction ACID.
 *     3. `processZaloPayCallback`: Tiếp nhận & xử lý Webhook Server-to-Server từ ZaloPay.
 *     4. `getZaloPayStatus`: Tra cứu trạng thái giao dịch ZaloPay của đơn hàng.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import {
  getZaloPayConfig,
  createZaloPayOrderMac,
  createZaloPayQueryMac,
  verifyZaloPayCallbackMac,
  formatDateYYMMDD,
} from '../../config/zalopay.js';
import { generateVoucherCode } from './order.service.js';

export interface ZaloPayOrderResponse {
  return_code: number;
  return_message: string;
  sub_return_code?: number;
  sub_return_message?: string;
  order_url?: string;
  zp_trans_token?: string;
  order_token?: string;
  qr_code?: string;
}

/**
 * 1. Khởi tạo đơn hàng thanh toán ZaloPay Sandbox v2
 */
export async function createZaloPayOrder(
  customerId: number,
  orderId: number,
  bankCode?: string
) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Bước 1: Kiểm tra tính hợp lệ của đơn hàng
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

  // Bước 2: Kiểm tra thời hạn 5 phút
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

  // Idempotency
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

  // Bước 3: Lấy danh sách sản phẩm trong đơn để tạo `item`
  const itemsRes = await pool.query(
    `SELECT 
       oi.order_item_id,
       oi.program_id,
       oi.quantity,
       oi.unit_price,
       vp.program_name
     FROM order_items oi
     JOIN voucher_programs vp ON vp.program_id = oi.program_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const items = itemsRes.rows.map((item: any) => ({
    itemid: String(item.program_id),
    itemname: item.program_name || `Voucher #${item.program_id}`,
    itemprice: Math.round(Number(item.unit_price)),
    itemquantity: Number(item.quantity),
  }));

  const config = getZaloPayConfig();
  const timeNow = Date.now();
  const datePrefix = formatDateYYMMDD(new Date());
  // Mã giao dịch ZaloPay chuẩn: format yyMMdd_orderId_time
  const appTransId = `${datePrefix}_${orderId}_${timeNow.toString().slice(-6)}`;
  const appUser = `user_${customerId}`;
  const amount = Math.round(Number(order.total_amount));
  const description = `Lumina Marketplace - Thanh toan don hang #${orderId}`;

  // Gắn thông tin giao dịch vào URL để frontend nhận diện được redirect.
  const redirectUrl = new URL(config.redirectUrl);
  redirectUrl.searchParams.set('order_id', String(orderId));
  redirectUrl.searchParams.set('apptransid', appTransId);
  redirectUrl.searchParams.set('zalopay_redirect', 'true');

  // embed_data chứa redirecturl để ZaloPay redirect về sau khi thanh toán
  const embedDataObj = {
    redirecturl: redirectUrl.toString(),
    orderId,
    customerId,
  };
  const embedData = JSON.stringify(embedDataObj);
  const itemStr = JSON.stringify(items);

  // Tạo chữ ký MAC với Key1
  const mac = createZaloPayOrderMac({
    appId: config.appId,
    appTransId,
    appUser,
    amount,
    appTime: timeNow,
    embedData,
    item: itemStr,
    key1: config.key1,
  });

  const requestPayload = {
    app_id: config.appId,
    app_user: appUser,
    app_trans_id: appTransId,
    app_time: timeNow,
    amount,
    item: itemStr,
    description,
    embed_data: embedData,
    bank_code: bankCode || '',
    callback_url: config.callbackUrl,
    mac,
  };

  try {
    const formParams = new URLSearchParams();
    for (const [k, v] of Object.entries(requestPayload)) {
      formParams.append(k, String(v));
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });

    const data = (await response.json()) as any;

    if (data && data.return_code === 1) {
      const orderUrl = data.order_url || data.orderurl || data.qr_code || data.order_token;
      if (orderUrl) {
        return {
          success: true,
          message: data.return_message || 'Khởi tạo phiên thanh toán ZaloPay thành công.',
          payment: {
            order_id: orderId,
            app_trans_id: appTransId,
            zp_trans_token: data.zp_trans_token,
            order_url: orderUrl,
            qr_code: data.qr_code || orderUrl,
            amount_vnd: amount,
            status: 'OPEN',
            created_at: new Date().toISOString(),
          },
        };
      }
    }

    console.warn('[ZaloPay Sandbox] Phản hồi lỗi từ OpenAPI:', data);
    throw {
      status: 400,
      message: `ZaloPay: ${data.return_message || data.sub_return_message || 'Không thể tạo phiên thanh toán ZaloPay.'}`,
    };
  } catch (apiError: any) {
    if (apiError.status) throw apiError;
    console.error('[ZaloPay Sandbox] Lỗi kết nối OpenAPI:', apiError.message);
    throw {
      status: 502,
      message: `Không thể kết nối đến Cổng thanh toán ZaloPay Sandbox: ${apiError.message}`,
    };
  }
}

/**
 * 2. Tiếp nhận và xử lý Webhook Callback từ ZaloPay
 */
export async function processZaloPayCallback(callbackBody: {
  data: string;
  mac: string;
  type?: number;
}) {
  const config = getZaloPayConfig();

  // Xác thực chữ ký MAC với Key2
  const isValidMac = verifyZaloPayCallbackMac(callbackBody.data, callbackBody.mac, config.key2);
  if (!isValidMac) {
    console.warn('[ZaloPay Callback] Chữ ký MAC không hợp lệ.');
    return { return_code: -1, return_message: 'mac not equal' };
  }

  let dataJson: any = {};
  try {
    dataJson = JSON.parse(callbackBody.data);
  } catch {
    return { return_code: 0, return_message: 'json parse error' };
  }

  // Trích xuất Order ID
  let dbOrderId: number | null = null;
  if (dataJson.embed_data) {
    try {
      const embed = JSON.parse(dataJson.embed_data);
      if (embed.orderId) dbOrderId = Number(embed.orderId);
    } catch {}
  }

  if (!dbOrderId && dataJson.app_trans_id) {
    const parts = String(dataJson.app_trans_id).split('_');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      dbOrderId = Number(parts[1]);
    }
  }

  if (!dbOrderId) {
    return { return_code: 0, return_message: 'order not found in data' };
  }

  // Bắt đầu cập nhật đơn hàng
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`,
      [dbOrderId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { return_code: 0, return_message: 'order not found' };
    }

    const order = orderRes.rows[0];

    if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
      await client.query('COMMIT');
      return { return_code: 1, return_message: 'success' };
    }

    // Cập nhật trạng thái đơn hàng
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', order_status = 'COMPLETED', payment_method = 'ZALOPAY'
       WHERE order_id = $1`,
      [dbOrderId]
    );

    // Phát hành mã voucher
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
    return { return_code: 1, return_message: 'success' };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ZaloPay Callback] Transaction error:', error);
    return { return_code: 0, return_message: 'internal error' };
  } finally {
    client.release();
  }
}

/**
 * 3. Xác thực và Capture đơn hàng từ ZaloPay sau khi người dùng quay lại web
 */
export async function verifyAndCaptureZaloPayOrder(
  customerId: number,
  orderId: number,
  zaloPayParams?: any
) {
  let targetOrderId = orderId;
  if ((!targetOrderId || isNaN(targetOrderId)) && zaloPayParams) {
    if (zaloPayParams.order_id) {
      targetOrderId = Number(zaloPayParams.order_id);
    } else if (zaloPayParams.apptransid) {
      const parts = String(zaloPayParams.apptransid).split('_');
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        targetOrderId = Number(parts[1]);
      }
    }
  }

  if (!targetOrderId || isNaN(targetOrderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  // Kiểm tra mã kết quả nếu có
  if (zaloPayParams && zaloPayParams.status !== undefined) {
    const statusNum = Number(zaloPayParams.status);
    if (statusNum !== 1 && statusNum !== 0) {
      throw {
        status: 400,
        message: 'Giao dịch ZaloPay không thành công hoặc đã bị hủy.',
      };
    }
  }

  // Khi gateway không chuyển đủ tham số redirect, đối soát trực tiếp với ZaloPay.
  if (zaloPayParams?.apptransid) {
    const config = getZaloPayConfig();
    const appTransId = String(zaloPayParams.apptransid);
    const mac = createZaloPayQueryMac({
      appId: config.appId,
      appTransId,
      key1: config.key1,
    });
    const formParams = new URLSearchParams({
      app_id: String(config.appId),
      app_trans_id: appTransId,
      mac,
    });
    const response = await fetch(config.queryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });
    const statusData = (await response.json()) as any;
    const isPaid = statusData.return_code === 1 &&
      (statusData.sub_return_code === 1 || statusData.status === 1);
    if (!isPaid) {
      throw {
        status: 400,
        message: 'ZaloPay chưa xác nhận giao dịch thành công. Vui lòng thử lại sau ít giây.',
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa dòng đơn hàng FOR UPDATE
    const orderRes = await client.query(
      `SELECT 
         *, 
         EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))::int AS elapsed_seconds 
       FROM orders 
       WHERE order_id = $1 AND (buyer_user_id = $2 OR recipient_user_id = $2)
       FOR UPDATE`,
      [targetOrderId, customerId]
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
        [targetOrderId]
      );
      await client.query('COMMIT');
      return {
        success: true,
        message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
        order: {
          order_id: targetOrderId,
          created_at: order.created_at,
          total_amount: Number(order.total_amount),
          payment_method: 'ZALOPAY',
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
       SET payment_status = 'PAID', order_status = 'COMPLETED', payment_method = 'ZALOPAY'
       WHERE order_id = $1`,
      [targetOrderId]
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
      [targetOrderId]
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
      message: 'Xác thực thanh toán ZaloPay và phát hành E-Voucher thành công.',
      order: {
        order_id: targetOrderId,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        payment_method: 'ZALOPAY',
        payment_status: 'PAID',
        order_status: 'COMPLETED',
        recipient_user_id: order.recipient_user_id,
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
 * 4. Tra cứu trạng thái thanh toán ZaloPay của đơn hàng
 */
export async function getZaloPayStatus(orderId: number) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  const orderRes = await pool.query(
    `SELECT 
       order_id,
       total_amount,
       payment_method,
       payment_status,
       order_status,
       created_at
     FROM orders 
     WHERE order_id = $1`,
    [orderId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin đơn hàng.' };
  }

  const order = orderRes.rows[0];

  const vouchersRes = await pool.query(
    `SELECT iv.*, vp.program_name 
     FROM issued_vouchers iv
     JOIN voucher_programs vp ON vp.program_id = iv.program_id
     WHERE iv.order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = $1)`,
    [orderId]
  );

  return {
    success: true,
    payment: {
      order_id: orderId,
      total_amount: Number(order.total_amount),
      payment_method: order.payment_method || 'ZALOPAY',
      payment_status: order.payment_status,
      order_status: order.order_status,
      created_at: order.created_at,
    },
    vouchers: vouchersRes.rows,
  };
}
