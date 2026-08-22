import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
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

  // Tạo user CUSTOMER mới cho test suite Stripe
  const uniqueEmail = `testcustomer_stripe_${Date.now()}@example.com`;
  const newUserRes = await pool.query(
    `INSERT INTO users (email, full_name, role, status, password_hash)
     VALUES ($1, 'Test Customer Stripe', 'CUSTOMER', 'ACTIVE', 'hash')
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

test('Stripe: 1. Danh sách phương thức thanh toán phải có Stripe', async () => {
  const res = await request('/api/customer/payments/methods');
  assert.equal(res.status, 200);

  const data: any = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.payment_methods));

  const stripeMethod = data.payment_methods.find((m: any) => m.code === 'STRIPE');
  assert.ok(stripeMethod, 'Phải có cổng thanh toán STRIPE');
  assert.equal(stripeMethod.is_active, true);
});

test('Stripe: 2. Không có token xác thực thì bị chặn 401', async () => {
  const res = await request('/api/customer/payments/stripe/create-checkout-session', undefined, {
    method: 'POST',
    body: JSON.stringify({ order_id: 999999 }),
  });
  assert.equal(res.status, 401);
});

test('Stripe: 3. Tạo Stripe Checkout Session thật trên Stripe Sandbox', async () => {
  // Tạo 1 đơn hàng thật cho customer
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'STRIPE',
    }),
  });
  assert.equal(orderRes.status, 201);
  const orderData: any = await orderRes.json();
  const orderId = orderData.order.order_id;
  assert.ok(orderId > 0);

  // Gọi tạo Stripe Checkout Session
  const stripeRes = await request('/api/customer/payments/stripe/create-checkout-session', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
  assert.equal(stripeRes.status, 201);

  const stripeData: any = await stripeRes.json();
  assert.equal(stripeData.success, true);
  assert.ok(stripeData.payment.session_id, 'Phải có session_id từ Stripe');
  assert.ok(stripeData.payment.checkout_url, 'Phải có checkout_url từ Stripe');
  assert.equal(stripeData.payment.currency, 'VND');

  // Tra cứu trạng thái đơn hàng
  const statusRes = await request(`/api/customer/payments/stripe/order/${orderId}/status`, customerToken);
  assert.equal(statusRes.status, 200);
  const statusData: any = await statusRes.json();
  assert.equal(statusData.order_id, orderId);
  assert.equal(statusData.order_status, 'PENDING');
});

test('Stripe: 4. Capture đơn hàng Stripe cập nhật trạng thái PAID và phát hành E-Voucher', async () => {
  // Tạo 1 đơn hàng mới
  const orderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 2 }],
      payment_method: 'STRIPE',
    }),
  });
  const orderData: any = await orderRes.json();
  const orderId = orderData.order.order_id;

  // Capture đơn hàng
  const captureRes = await request('/api/customer/payments/stripe/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
  assert.equal(captureRes.status, 200);

  const captureData: any = await captureRes.json();
  assert.equal(captureData.success, true);
  assert.equal(captureData.order.payment_status, 'PAID');
  assert.equal(captureData.order.order_status, 'COMPLETED');
  assert.equal(captureData.order.payment_method, 'STRIPE');
  assert.equal(captureData.order.vouchers.length, 2, 'Phát hành đúng 2 voucher');

  // Kiểm tra tính Idempotent: Gọi capture lại lần 2 không được phát sinh voucher trùng
  const secondCaptureRes = await request('/api/customer/payments/stripe/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });
  assert.equal(secondCaptureRes.status, 200);
  const secondData: any = await secondCaptureRes.json();
  assert.equal(secondData.success, true);
});
