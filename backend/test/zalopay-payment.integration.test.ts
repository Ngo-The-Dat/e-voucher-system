import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import { createZaloPayOrderMac } from '../src/config/zalopay.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl = '';
let customerToken = '';
let customerId: number;

const request = (path: string, token?: string, init: RequestInit = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

before(async () => {
  const secret = process.env.JWT_SECRET || 'testsecret';
  process.env.JWT_SECRET = secret;

  // Tạo user CUSTOMER mới cho test suite ZaloPay
  const uniqueEmail = `testcustomer_zalopay_${Date.now()}@example.com`;
  const newUserRes = await pool.query(
    `INSERT INTO users (email, full_name, role, status, password_hash)
     VALUES ($1, 'Test Customer ZaloPay', 'CUSTOMER', 'ACTIVE', 'hash')
     RETURNING user_id`,
    [uniqueEmail]
  );
  customerId = Number(newUserRes.rows[0].user_id);
  customerToken = jwt.sign({ id: customerId, role: 'CUSTOMER' }, secret, { expiresIn: '10m' });

  // Đảm bảo voucher program_id = 1 hợp lệ để bán
  await pool.query(
    `UPDATE voucher_programs 
     SET sale_start_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
         sale_end_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
         use_start_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
         use_end_at = CURRENT_TIMESTAMP + INTERVAL '60 days',
         display_status = 'PUBLISHED'
     WHERE program_id = 1`
  );

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (customerId) {
    await pool.query(`DELETE FROM issued_vouchers WHERE owner_user_id = $1`, [customerId]);
    await pool.query(`DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE buyer_user_id = $1)`, [customerId]);
    await pool.query(`DELETE FROM orders WHERE buyer_user_id = $1`, [customerId]);
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [customerId]);
  }
});

test('ZaloPay: 1. Danh sách phương thức thanh toán phải có ZALOPAY', async () => {
  const res = await request('/api/customer/payments/methods');
  assert.equal(res.status, 200);

  const data = (await res.json()) as any;
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.payment_methods));

  const zaloPayMethod = data.payment_methods.find((m: any) => m.code === 'ZALOPAY');
  assert.ok(zaloPayMethod, 'Phải có cổng thanh toán ZALOPAY');
  assert.equal(zaloPayMethod.currency, 'VND');
});

test('ZaloPay: 2. Không có token xác thực thì bị chặn 401 khi tạo phiên thanh toán', async () => {
  const res = await request('/api/customer/payments/zalopay/create', undefined, {
    method: 'POST',
    body: JSON.stringify({ order_id: 9999 }),
  });
  assert.equal(res.status, 401);
});

test('ZaloPay: 3. Khởi tạo phiên thanh toán ZaloPay Sandbox cho đơn hàng', async () => {
  // Tạo đơn hàng mới
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'ZALOPAY',
    }),
  });
  assert.equal(orderRes.status, 201);
  const orderData = (await orderRes.json()) as any;
  const orderId = orderData.order.order_id;
  assert.ok(orderId, 'Phải tạo được đơn hàng');

  // Gọi API tạo phiên thanh toán ZaloPay
  const zaloPayRes = await request('/api/customer/payments/zalopay/create', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
  assert.equal(zaloPayRes.status, 200);
  const zaloPayData = (await zaloPayRes.json()) as any;

  assert.equal(zaloPayData.success, true);
  assert.ok(zaloPayData.payment, 'Phải có thông tin payment');
  assert.equal(zaloPayData.payment.order_id, orderId);
  assert.ok(zaloPayData.payment.order_url, 'Phải có order_url chuyển hướng');
  assert.ok(zaloPayData.payment.app_trans_id, 'Phải có app_trans_id');
});

test('ZaloPay: 4. Capture đơn hàng ZaloPay khi nhận redirect thành công và phát hành E-Voucher', async () => {
  // Tạo đơn hàng
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 2 }],
      payment_method: 'ZALOPAY',
    }),
  });
  const orderData = (await orderRes.json()) as any;
  const orderId = orderData.order.order_id;

  // Capture đơn hàng khi redirect về
  const captureRes = await request('/api/customer/payments/zalopay/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      status: 1,
      apptransid: `260822_${orderId}_123456`,
    }),
  });
  assert.equal(captureRes.status, 200);
  const captureData = (await captureRes.json()) as any;

  assert.equal(captureData.success, true);
  assert.equal(captureData.order.payment_status, 'PAID');
  assert.equal(captureData.order.order_status, 'COMPLETED');
  assert.equal(captureData.order.payment_method, 'ZALOPAY');
  assert.equal(captureData.vouchers.length, 2, 'Phải phát hành đúng 2 voucher');
  assert.ok(captureData.vouchers[0].voucher_code.startsWith('EV-'));

  // Kiểm tra tra cứu trạng thái
  const statusRes = await request(`/api/customer/payments/zalopay/order/${orderId}/status`, customerToken);
  assert.equal(statusRes.status, 200);
  const statusData = (await statusRes.json()) as any;
  assert.equal(statusData.payment.payment_status, 'PAID');
});

test('ZaloPay: 5. Webhook Callback xử lý giao dịch ZaloPay Server-to-Server', async () => {
  // Tạo đơn hàng
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'ZALOPAY',
    }),
  });
  const orderData = (await orderRes.json()) as any;
  const orderId = orderData.order.order_id;

  const appTransId = `260822_${orderId}_654321`;
  const callbackDataObj = {
    app_id: 2554,
    app_trans_id: appTransId,
    app_time: Date.now(),
    app_user: `user_${customerId}`,
    amount: 100000,
    embed_data: JSON.stringify({ orderId }),
    item: '[]',
    zp_trans_id: 210308000000001,
    server_time: Date.now(),
    channel: 38,
  };

  const dataStr = JSON.stringify(callbackDataObj);
  // MAC tính với Key2
  const crypto = await import('node:crypto');
  const mac = crypto.createHmac('sha256', 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf').update(dataStr).digest('hex');

  const cbRes = await request('/api/customer/payments/zalopay/callback', undefined, {
    method: 'POST',
    body: JSON.stringify({
      data: dataStr,
      mac,
      type: 1,
    }),
  });

  assert.equal(cbRes.status, 200);
  const cbResult = (await cbRes.json()) as any;
  assert.equal(cbResult.return_code, 1);
});
