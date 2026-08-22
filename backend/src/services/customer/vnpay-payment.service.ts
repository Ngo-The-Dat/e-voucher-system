import pool from '../../config/db.js';
import { getVNPayConfig, generateVNPaySignature, sortObject, formatDate } from '../../config/vnpay.js';
import { generateVoucherCode } from './order.service.js';
import qs from 'qs';

export async function createVNPayPaymentUrl(
  customerId: number,
  orderId: number,
  ipAddr: string
) {
  if (!orderId || isNaN(orderId)) {
    throw { status: 400, message: 'Mã đơn hàng không hợp lệ.' };
  }

  const orderRes = await pool.query(
    `SELECT 
       o.order_id, o.buyer_user_id, o.recipient_user_id, o.total_amount, 
       o.payment_status, o.order_status, o.created_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))::int AS elapsed_seconds
     FROM orders o
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

  const elapsedSeconds = Number(order.elapsed_seconds || 0);
  if (elapsedSeconds > 300) {
    await pool.query(`UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = $1`, [orderId]);
    throw { status: 400, message: 'Đơn hàng đã hết hạn thời gian thanh toán (5 phút).' };
  }

  if (order.order_status === 'COMPLETED' && order.payment_status === 'PAID') {
    return {
      success: true,
      message: 'Đơn hàng đã được thanh toán hoàn tất trước đó.',
      payment: {
        order_id: orderId,
        status: 'COMPLETED'
      }
    };
  }

  const config = getVNPayConfig();
  const date = new Date();
  const createDate = formatDate(date);
  
  // Expiry date = createDate + 5 minutes
  date.setMinutes(date.getMinutes() + 5);
  const expireDate = formatDate(date);

  const amount = Number(order.total_amount) * 100;
  
  let vnp_Params: Record<string, string | number> = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = config.tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = `${orderId}_${new Date().getTime()}`; // unique ref
  vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang ${orderId}`;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount;
  vnp_Params['vnp_ReturnUrl'] = config.returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_ExpireDate'] = expireDate;

  vnp_Params = sortObject(vnp_Params);
  
  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = generateVNPaySignature(signData, config.hashSecret);
  
  vnp_Params['vnp_SecureHash'] = signed;
  const vnpUrl = config.url + '?' + qs.stringify(vnp_Params, { encode: false });

  return {
    success: true,
    message: 'Khởi tạo phiên thanh toán VNPay thành công.',
    payment: {
      order_id: orderId,
      amount_vnd: Number(order.total_amount),
      pay_url: vnpUrl,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    },
  };
}

export async function processVNPayIpn(ipnQuery: any) {
  let vnp_Params = ipnQuery;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  const config = getVNPayConfig();
  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = generateVNPaySignature(signData, config.hashSecret);

  if (secureHash !== signed) {
    return { RspCode: '97', Message: 'Invalid signature' };
  }

  // Extract orderId from vnp_TxnRef (format: orderId_timestamp)
  const txnRef = vnp_Params['vnp_TxnRef'];
  const dbOrderId = Number(txnRef.split('_')[0]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 FOR UPDATE`,
      [dbOrderId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { RspCode: '01', Message: 'Order not found' };
    }

    const order = orderRes.rows[0];

    // Check Amount
    const amount = Number(vnp_Params['vnp_Amount']) / 100;
    if (Number(order.total_amount) !== amount) {
      await client.query('ROLLBACK');
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    if (order.payment_status === 'PAID') {
      await client.query('ROLLBACK');
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const responseCode = vnp_Params['vnp_ResponseCode'];
    if (responseCode === '00') {
      // Payment success
      await client.query(
        `UPDATE orders 
         SET payment_status = 'PAID', order_status = 'COMPLETED', payment_method = 'VNPAY'
         WHERE order_id = $1`,
        [dbOrderId]
      );

      // Generate E-Vouchers
      const itemsRes = await client.query(
        `SELECT voucher_id, quantity FROM order_items WHERE order_id = $1`,
        [dbOrderId]
      );

      for (const item of itemsRes.rows) {
        for (let i = 0; i < item.quantity; i++) {
          const evCode = await generateVoucherCode();
          await client.query(
            `INSERT INTO evouchers (order_id, voucher_id, owner_id, evoucher_code, status, created_at, expired_at)
             VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP, (SELECT expired_at FROM vouchers WHERE voucher_id = $2))`,
            [dbOrderId, item.voucher_id, order.recipient_user_id || order.buyer_user_id, evCode]
          );
        }
      }
      await client.query('COMMIT');
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // Payment failed
      await client.query(
        `UPDATE orders SET payment_status = 'FAILED' WHERE order_id = $1`,
        [dbOrderId]
      );
      await client.query('COMMIT');
      return { RspCode: '00', Message: 'Confirm Success' };
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('VNPay IPN Error:', err);
    return { RspCode: '99', Message: 'Unknown error' };
  } finally {
    client.release();
  }
}

export async function verifyVNPayReturn(query: any) {
  let vnp_Params = query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  const config = getVNPayConfig();
  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = generateVNPaySignature(signData, config.hashSecret);

  if (secureHash !== signed) {
    return { success: false, message: 'Chữ ký không hợp lệ.' };
  }

  const responseCode = vnp_Params['vnp_ResponseCode'];
  const txnRef = vnp_Params['vnp_TxnRef'];
  const orderId = Number(txnRef.split('_')[0]);

  if (responseCode === '00') {
    return { success: true, message: 'Giao dịch thành công.', orderId };
  } else {
    return { success: false, message: 'Giao dịch không thành công hoặc bị hủy.', orderId };
  }
}
