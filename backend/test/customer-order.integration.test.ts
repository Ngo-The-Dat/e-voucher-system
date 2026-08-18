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

  // Tạo user CUSTOMER mới tinh cho test suite để tránh ảnh hưởng dữ liệu cũ
  const uniqueEmail = `testcustomer_order_${Date.now()}@example.com`;
  const newUserRes = await pool.query(
    `INSERT INTO users (email, full_name, role, status, password_hash)
     VALUES ($1, 'Test Customer Order', 'CUSTOMER', 'ACTIVE', 'hash')
     RETURNING user_id`,
    [uniqueEmail]
  );
  const customerId = newUserRes.rows[0].user_id;
  customerToken = jwt.sign({ id: Number(customerId), role: 'CUSTOMER' }, secret, { expiresIn: '10m' });

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

  // 2. Create Order (chưa thanh toán: UNPAID, PENDING)
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
  assert.equal(data.order.order_status, 'PENDING');
  assert.equal(data.order.payment_status, 'UNPAID');

  const createdOrderId = data.order.order_id;

  // 2.1. Thanh toán đơn hàng (PAID, COMPLETED, phát hành voucher)
  const payRes = await request(`/api/customer/orders/${createdOrderId}/pay`, customerToken, {
    method: 'POST',
    body: JSON.stringify({
      payment_method: 'Ví VNPay',
    }),
  });
  assert.equal(payRes.status, 200);
  const payData = (await payRes.json()) as any;
  assert.equal(payData.success, true);
  assert.equal(payData.order.order_status, 'COMPLETED');
  assert.equal(payData.order.payment_status, 'PAID');
  assert.ok(Array.isArray(payData.order.vouchers));
  assert.equal(payData.order.vouchers.length, 1);
  assert.ok(payData.order.vouchers[0].voucher_code.startsWith('EV-'));

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
  assert.equal(detailData.order_status, 'COMPLETED');
  assert.equal(detailData.payment_status, 'PAID');

  // 5. Get customer vouchers list (Kho voucher)
  const vouchersRes = await request('/api/customer/my-vouchers', customerToken);
  assert.equal(vouchersRes.status, 200);
  const vouchersData = (await vouchersRes.json()) as any;
  assert.ok(Array.isArray(vouchersData.vouchers));
  const issuedVoucher = vouchersData.vouchers.find((v: any) => v.voucher_code === payData.order.vouchers[0].voucher_code);
  assert.ok(issuedVoucher);

  // 6. Get single customer voucher detail by issued_voucher_id
  const singleVoucherRes = await request(`/api/customer/my-vouchers/${issuedVoucher.issued_voucher_id}`, customerToken);
  assert.equal(singleVoucherRes.status, 200);
  const singleVoucherData = (await singleVoucherRes.json()) as any;
  assert.equal(singleVoucherData.issued_voucher_id, issuedVoucher.issued_voucher_id);
  assert.equal(singleVoucherData.voucher_code, issuedVoucher.voucher_code);
  assert.equal(singleVoucherData.payment_status, 'PAID');
  assert.equal(singleVoucherData.order_status, 'COMPLETED');
});

test('Customer Voucher API: get non-existent voucher returns 404', async () => {
  const res = await request('/api/customer/my-vouchers/99999999', customerToken);
  assert.equal(res.status, 404);
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

test('Customer Review API: rejects review when user has not purchased voucher', async () => {
  // Check eligibility for unpurchased program (e.g. program 9999 or unbought program)
  const unpurchasedProgramId = 99999;
  const checkRes = await request(`/api/customer/reviews/eligibility/${unpurchasedProgramId}`, customerToken);
  assert.equal(checkRes.status, 200);
  const checkData = (await checkRes.json()) as any;
  assert.equal(checkData.hasPurchased, false);
  assert.equal(checkData.canReview, false);

  // Attempt to submit review for unpurchased program
  const reviewRes = await request('/api/customer/reviews', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      programId: unpurchasedProgramId,
      rating: 5,
      reviewContent: 'Đánh giá thử nghiệm khi chưa mua',
    }),
  });

  assert.equal(reviewRes.status, 403);
  const reviewData = (await reviewRes.json()) as any;
  assert.match(reviewData.message, /chưa mua/i);
});

test('Customer Review API: allows review when user has purchased voucher', async () => {
  const programId = 1;
  const checkRes = await request(`/api/customer/reviews/eligibility/${programId}`, customerToken);
  assert.equal(checkRes.status, 200);
  const checkData = (await checkRes.json()) as any;
  assert.equal(checkData.hasPurchased, true);
  assert.equal(checkData.canReview, true);

  // Submit valid review
  const reviewRes = await request('/api/customer/reviews', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      programId,
      rating: 5,
      reviewContent: 'Sản phẩm rất tốt và dịch vụ chu đáo!',
    }),
  });

  assert.equal(reviewRes.status, 201);
  const reviewData = (await reviewRes.json()) as any;
  assert.ok(reviewData.review);
  assert.equal(reviewData.review.rating, 5);
  const reviewedIssuedVoucherId = reviewData.review.issued_voucher_id;

  // 1. Attempt duplicate review on the EXACT SAME issued voucher code (should be rejected with 400)
  const duplicateDirectRes = await request('/api/customer/reviews', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      issuedVoucherId: reviewedIssuedVoucherId,
      rating: 4,
      reviewContent: 'Đánh giá trùng trên cùng 1 mã voucher',
    }),
  });
  assert.equal(duplicateDirectRes.status, 400);
  const duplicateDirectData = (await duplicateDirectRes.json()) as any;
  assert.match(duplicateDirectData.message, /1 lần/i);

  // 2. Now that all voucher codes of this program are reviewed, submitting by programId must also fail with 400
  const noRemainingVouchersRes = await request('/api/customer/reviews', customerToken, {
    method: 'POST',
    body: JSON.stringify({
      programId,
      rating: 5,
      reviewContent: 'Không còn mã nào chưa đánh giá',
    }),
  });
  assert.equal(noRemainingVouchersRes.status, 400);
  const noRemainingData = (await noRemainingVouchersRes.json()) as any;
  assert.match(noRemainingData.message, /1 lần/i);
});


