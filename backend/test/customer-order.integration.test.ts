import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl = '';
let customerToken = '';

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
  customerToken = jwt.sign({ id: 8, role: 'CUSTOMER' }, secret, { expiresIn: '10m' });

  // Ensure program_id 1 is published and within valid sale dates
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

test('Customer Order API: authentication guard', async () => {
  const unauthRes = await request('/api/customer/orders');
  assert.equal(unauthRes.status, 401);
});

test('Customer Order API: create order & issue vouchers successfully', async () => {
  const programId = 1;

  // 1. Add item to cart
  const addCartRes = await request('/api/customer/cart', customerToken, {
    method: 'POST',
    body: JSON.stringify({ programId, quantity: 1 }),
  });
  assert.equal(addCartRes.status, 200);

  // 2. Create Order
  const createOrderRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: programId, quantity: 1 }],
      is_gift: false,
      payment_method: 'Ví VNPay',
    }),
  });

  assert.equal(createOrderRes.status, 201);
  const data = (await createOrderRes.json()) as any;
  assert.equal(data.success, true);
  assert.ok(data.order);
  assert.ok(data.order.order_id);
  assert.ok(Array.isArray(data.order.vouchers));
  assert.equal(data.order.vouchers.length, 1);
  assert.ok(data.order.vouchers[0].voucher_code.startsWith('EV-'));

  const createdOrderId = data.order.order_id;

  // 3. Get customer orders list
  const getOrdersRes = await request('/api/customer/orders', customerToken);
  assert.equal(getOrdersRes.status, 200);
  const ordersData = (await getOrdersRes.json()) as any;
  assert.ok(Array.isArray(ordersData.orders));

  // 4. Get order detail
  const detailRes = await request(`/api/customer/orders/${createdOrderId}`, customerToken);
  assert.equal(detailRes.status, 200);
  const detailData = (await detailRes.json()) as any;
  assert.equal(Number(detailData.order_id), createdOrderId);

  // 5. Get customer vouchers list (Kho voucher)
  const vouchersRes = await request('/api/customer/orders/vouchers', customerToken);
  assert.equal(vouchersRes.status, 200);
  const vouchersData = (await vouchersRes.json()) as any;
  assert.ok(Array.isArray(vouchersData.vouchers));
  assert.ok(vouchersData.vouchers.some((v: any) => v.voucher_code === data.order.vouchers[0].voucher_code));
});

test('Customer Order API: create gift order', async () => {
  const programId = 1;

  const createGiftRes = await request('/api/customer/orders', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ program_id: programId, quantity: 1 }],
      is_gift: true,
      recipient_info: {
        full_name: 'Nguyễn Văn Quà Tặng',
        email: `recipient_${Date.now()}@example.com`,
        phone: '0987654321',
      },
      payment_method: 'Ví MoMo',
    }),
  });

  assert.equal(createGiftRes.status, 201);
  const data = (await createGiftRes.json()) as any;
  assert.equal(data.success, true);
  assert.equal(data.order.is_gift, true);
});
