import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import type { Server } from 'node:http';
import { getVndToUsdRate, convertVndToUsd, clearExchangeRateCache } from '../src/services/customer/exchange-rate.service.js';

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

  // Tạo user CUSTOMER mới cho test suite
  const uniqueEmail = `testcustomer_paypal_${Date.now()}@example.com`;
  const newUserRes = await pool.query(
    `INSERT INTO users (email, full_name, role, status, password_hash)
     VALUES ($1, 'Test Customer PayPal', 'CUSTOMER', 'ACTIVE', 'hash')
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
  await new Promise<void>((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
  await pool.end();
});

test('Exchange Rate Service: getVndToUsdRate & convertVndToUsd', async () => {
  clearExchangeRateCache();
  const rateResult = await getVndToUsdRate();
  assert.ok(rateResult.rate > 0);
  assert.ok(['API', 'CACHE', 'FALLBACK_ENV'].includes(rateResult.source));

  const conv = await convertVndToUsd(500000);
  assert.equal(conv.amountVnd, 500000);
  assert.ok(conv.amountUsd > 0);
  assert.ok(conv.exchangeRate > 0);
});

test('Payment Methods API: GET /api/customer/payments/methods is accessible', async () => {
  const res = await request('/api/customer/payments/methods');
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.payment_methods));
  assert.ok(data.payment_methods.some((m: any) => m.code === 'PAYPAL'));
  assert.ok(data.payment_methods.some((m: any) => m.code === 'STRIPE'));
  assert.ok(data.payment_methods.some((m: any) => m.code === 'VNPAY'));
  assert.ok(data.payment_methods.some((m: any) => m.code === 'MOMO'));
});

test('PayPal API: Authentication guard blocks unauthenticated requests', async () => {
  const res = await request('/api/customer/payments/paypal/create-order', undefined, {
    method: 'POST',
    body: JSON.stringify({ order_id: 1 }),
  });
  assert.equal(res.status, 401);
});

test('PayPal API: Create PayPal order, capture payment and issue vouchers', async () => {
  // 1. Tạo đơn hàng với payment_method = 'PAYPAL'
  const createOrderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 2 }],
      is_gift: false,
      payment_method: 'PAYPAL',
    }),
  });

  assert.equal(createOrderRes.status, 201);
  const orderData = (await createOrderRes.json()) as any;
  const orderId = orderData.order.order_id;
  assert.ok(orderId);
  assert.equal(orderData.order.payment_status, 'UNPAID');
  assert.equal(orderData.order.order_status, 'PENDING');

  // 2. Khởi tạo PayPal Order
  const createPayPalRes = await request('/api/customer/payments/paypal/create-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  });

  assert.equal(createPayPalRes.status, 201);
  const paypalData = (await createPayPalRes.json()) as any;
  assert.equal(paypalData.success, true);
  assert.ok(paypalData.payment);
  assert.equal(paypalData.payment.order_id, orderId);
  assert.ok(paypalData.payment.paypal_order_id.startsWith('PAYID-EV-'));
  assert.ok(paypalData.payment.amount_usd > 0);
  assert.ok(paypalData.payment.exchange_rate > 0);
  assert.ok(paypalData.payment.approve_url.includes('paypal.com'));

  const paypalOrderId = paypalData.payment.paypal_order_id;

  // 3. Tra cứu trạng thái đơn trước khi thanh toán
  const statusRes = await request(`/api/customer/payments/paypal/order/${orderId}/status`, customerToken);
  assert.equal(statusRes.status, 200);
  const statusData = (await statusRes.json()) as any;
  assert.equal(statusData.payment_status, 'UNPAID');
  assert.equal(statusData.order_status, 'PENDING');

  // 4. Capture PayPal Order (Thanh toán hoàn tất)
  const captureRes = await request('/api/customer/payments/paypal/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      paypal_order_id: paypalOrderId,
      payer_info: { email: 'buyer-test@example.com', name: 'Test Customer' },
    }),
  });

  assert.equal(captureRes.status, 200);
  const captureData = (await captureRes.json()) as any;
  assert.equal(captureData.success, true);
  assert.equal(captureData.order.payment_status, 'PAID');
  assert.equal(captureData.order.order_status, 'COMPLETED');
  assert.equal(captureData.order.payment_method, 'PAYPAL');
  assert.ok(Array.isArray(captureData.order.vouchers));
  assert.equal(captureData.order.vouchers.length, 2);

  // 5. Idempotent Capture: Gọi lại lần 2 không gây lỗi và không tạo trùng voucher
  const recaptureRes = await request('/api/customer/payments/paypal/capture-order', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      paypal_order_id: paypalOrderId,
    }),
  });
  assert.equal(recaptureRes.status, 200);
  const recaptureData = (await recaptureRes.json()) as any;
  assert.equal(recaptureData.success, true);
});

test('PayPal API: Simulation endpoints handle DECLINED and INSUFFICIENT_FUNDS scenarios', async () => {
  // 1. Tạo đơn hàng mới
  const createOrderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: 1, quantity: 1 }],
      payment_method: 'PAYPAL',
    }),
  });
  assert.equal(createOrderRes.status, 201);
  const orderData = (await createOrderRes.json()) as any;
  const orderId = orderData.order.order_id;

  // 2. Mô phỏng DECLINED
  const declinedRes = await request('/api/customer/payments/paypal/simulate', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      scenario: 'DECLINED',
    }),
  });
  assert.equal(declinedRes.status, 400);
  const declinedData = (await declinedRes.json()) as any;
  assert.equal(declinedData.error_code, 'PAYMENT_SOURCE_DECLINED_BY_PROCESSOR');

  // 3. Mô phỏng INSUFFICIENT_FUNDS
  const fundsRes = await request('/api/customer/payments/paypal/simulate', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      scenario: 'INSUFFICIENT_FUNDS',
    }),
  });
  assert.equal(fundsRes.status, 400);
  const fundsData = (await fundsRes.json()) as any;
  assert.equal(fundsData.error_code, 'INSUFFICIENT_FUNDS');
});
