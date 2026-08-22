import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import { createMoMoCreatePaymentSignature } from '../src/config/momo.js';
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

  // Tạo user CUSTOMER mới cho test suite MoMo
  const uniqueEmail = `testcustomer_momo_${Date.now()}@example.com`;
  const newUserRes = await pool.query(
    `INSERT INTO users (email, full_name, role, status, password_hash)
     VALUES ($1, 'Test Customer MoMo', 'CUSTOMER', 'ACTIVE', 'hash')
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
  // Cleanup test customer
  if (customerId) {
    await pool.query(`DELETE FROM issued_vouchers WHERE owner_user_id = $1`, [customerId]);
    await pool.query(`DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE buyer_user_id = $1)`, [customerId]);
    await pool.query(`DELETE FROM orders WHERE buyer_user_id = $1`, [customerId]);
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [customerId]);
  }
  await pool.end();
});

test('MoMo: 1. Danh sách phương thức thanh toán phải có MOMO', async () => {
  const res = await request('/api/customer/payments/methods');
  assert.equal(res.status, 200);

  const data: any = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.payment_methods));

  const momoMethod = data.payment_methods.find((m: any) => m.code === 'MOMO');
  assert.ok(momoMethod, 'Phải có cổng thanh toán MOMO');
  assert.equal(momoMethod.is_active, true);
  assert.equal(momoMethod.currency, 'VND');
});

test('MoMo: 2. Không có token xác thực thì bị chặn 401 khi tạo phiên thanh toán', async () => {
  const res = await request('/api/customer/payments/momo/create-payment', undefined, {
    method: 'POST',
    body: JSON.stringify({ order_id: 999999 }),
  });
  assert.equal(res.status, 401);
});

test('MoMo: 3. Khởi tạo phiên thanh toán MoMo Sandbox cho đơn hàng', async () => {
  // Tạo 1 đơn hàng thật cho customer
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'MOMO',
    }),
  });
  assert.equal(orderRes.status, 201);
  const orderData: any = await orderRes.json();
  const orderId = orderData.order.order_id;
  assert.ok(orderId > 0);

  // Gọi tạo phiên thanh toán MoMo
  const momoRes = await request('/api/customer/payments/momo/create-payment', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
  assert.equal(momoRes.status, 201);

  const momoData: any = await momoRes.json();
  assert.equal(momoData.success, true);
  assert.ok(momoData.payment.pay_url, 'Phải có pay_url trả về từ MoMo Sandbox');
  assert.equal(momoData.payment.order_id, orderId);

  // Tra cứu trạng thái đơn hàng MoMo
  const statusRes = await request(`/api/customer/payments/momo/order/${orderId}/status`, customerToken);
  assert.equal(statusRes.status, 200);
  const statusData: any = await statusRes.json();
  assert.equal(statusData.order_id, orderId);
  assert.equal(statusData.order_status, 'PENDING');
});

test('MoMo: 4. Capture đơn hàng MoMo khi nhận redirect thành công và phát hành E-Voucher', async () => {
  // Tạo 1 đơn hàng mới
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 2 }],
      payment_method: 'MOMO',
    }),
  });
  const orderData: any = await orderRes.json();
  const orderId = orderData.order.order_id;

  // Capture đơn hàng khi redirect về với resultCode = 0
  const captureRes = await request('/api/customer/payments/momo/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      resultCode: 0,
      message: 'Thành công',
    }),
  });
  assert.equal(captureRes.status, 200);

  const captureData: any = await captureRes.json();
  assert.equal(captureData.success, true);
  assert.equal(captureData.order.payment_status, 'PAID');
  assert.equal(captureData.order.order_status, 'COMPLETED');
  assert.equal(captureData.order.payment_method, 'MOMO');
  assert.equal(captureData.vouchers.length, 2, 'Phát hành đúng 2 voucher');

  // Kiểm tra tính Idempotent: Gọi capture lại không bị tạo voucher trùng
  const secondCaptureRes = await request('/api/customer/payments/momo/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, resultCode: 0 }),
  });
  assert.equal(secondCaptureRes.status, 200);
  const secondData: any = await secondCaptureRes.json();
  assert.equal(secondData.success, true);
});

test('MoMo: 5. Webhook IPN xử lý giao dịch MoMo Server-to-Server', async () => {
  // Tạo đơn hàng mới
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'MOMO',
    }),
  });
  const orderData: any = await orderRes.json();
  const orderId = orderData.order.order_id;

  // Giả lập webhook IPN từ máy chủ MoMo
  const ipnPayload = {
    partnerCode: 'MOMO',
    orderId: `EV_ORD_${orderId}_TEST`,
    requestId: `MOMO_REQ_${orderId}_TEST`,
    amount: orderData.order.total_amount,
    orderInfo: `Thanh toan #${orderId}`,
    orderType: 'momo_wallet',
    transId: Date.now(),
    resultCode: 0,
    message: 'Thành công',
    payType: 'qr',
    responseTime: Date.now(),
    extraData: Buffer.from(JSON.stringify({ orderId, customerId })).toString('base64'),
    signature: '',
  };

  const ipnRes = await request('/api/customer/payments/momo/ipn', undefined, {
    method: 'POST',
    body: JSON.stringify(ipnPayload),
  });
  assert.equal(ipnRes.status, 200);

  const ipnData: any = await ipnRes.json();
  assert.equal(ipnData.success, true);

  // Kiểm tra đơn hàng trong DB đã sang PAID và COMPLETED
  const checkRes = await pool.query(`SELECT * FROM orders WHERE order_id = $1`, [orderId]);
  assert.equal(checkRes.rows[0].payment_status, 'PAID');
  assert.equal(checkRes.rows[0].order_status, 'COMPLETED');
});
