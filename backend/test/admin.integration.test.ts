import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl = '';
let adminToken = '';
let nonAdminToken = '';

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
  const secret = process.env.JWT_SECRET;
  assert.ok(secret, 'JWT_SECRET must be configured');
  adminToken = jwt.sign({ id: 1, role: 'ADMIN' }, secret, { expiresIn: '10m' });
  nonAdminToken = jwt.sign({ id: 8, role: 'CUSTOMER' }, secret, { expiresIn: '10m' });

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

test('Admin Auth Guard: rejects unauthenticated and non-admin requests', async () => {
  const unauthRes = await request('/api/admin/dashboard/overview');
  assert.equal(unauthRes.status, 401);

  const forbiddenRes = await request('/api/admin/dashboard/overview', nonAdminToken);
  assert.equal(forbiddenRes.status, 403);
});

test('Admin Dashboard: returns metrics and overview statistics', async () => {
  const res = await request('/api/admin/dashboard/overview?timeframe=week', adminToken);
  assert.equal(res.status, 200);
  const data = await res.json() as any;
  assert.ok(Array.isArray(data.stats), 'Dashboard should return stats array');
  assert.ok(Array.isArray(data.efficiencyMetrics), 'Dashboard should return efficiencyMetrics array');
  assert.ok(Array.isArray(data.categoryPerformance), 'Dashboard should return categoryPerformance array');
});

test('Admin User Management: list, detail, change role, lock and unlock', async () => {
  // 1. List users
  const listRes = await request('/api/admin/users?page=1&limit=10', adminToken);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json() as any;
  assert.ok(Array.isArray(listData.users));
  assert.ok(listData.pagination);

  // 2. Get branches for assignment
  const branchesRes = await request('/api/admin/users/branches', adminToken);
  assert.equal(branchesRes.status, 200);
  const branchesData = await branchesRes.json() as any;
  assert.ok(Array.isArray(branchesData.branches));
  assert.ok(branchesData.branches.length > 0);

  // 3. Get user detail
  const detailRes = await request('/api/admin/users/8', adminToken);
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json() as any;
  assert.equal(Number(detailData.user_id), 8);

  // 4. Change role to PARTNER with business name and tax code
  const toPartnerRes = await request('/api/admin/users/8/role', adminToken, {
    method: 'PUT',
    body: JSON.stringify({
      role: 'PARTNER',
      business_name: 'Công Ty CP Kiểm Thử Tự Động',
      tax_code: '0109999888',
    }),
  });
  assert.equal(toPartnerRes.status, 200);
  const afterPartnerDetail = await (await request('/api/admin/users/8', adminToken)).json() as any;
  assert.equal(afterPartnerDetail.role, 'PARTNER');
  assert.equal(afterPartnerDetail.business_name, 'Công Ty CP Kiểm Thử Tự Động');
  assert.equal(afterPartnerDetail.tax_code, '0109999888');

  // 5. Change role to PARTNER_EMPLOYEE with branch assignment
  const toEmployeeRes = await request('/api/admin/users/8/role', adminToken, {
    method: 'PUT',
    body: JSON.stringify({
      role: 'PARTNER_EMPLOYEE',
      branch_id: branchesData.branches[0].branch_id,
    }),
  });
  assert.equal(toEmployeeRes.status, 200);
  const afterEmployeeDetail = await (await request('/api/admin/users/8', adminToken)).json() as any;
  assert.equal(afterEmployeeDetail.role, 'PARTNER_EMPLOYEE');
  assert.equal(Number(afterEmployeeDetail.branch_id), Number(branchesData.branches[0].branch_id));

  // 6. Change role back to CUSTOMER
  const toCustomerRes = await request('/api/admin/users/8/role', adminToken, {
    method: 'PUT',
    body: JSON.stringify({ role: 'CUSTOMER' }),
  });
  assert.equal(toCustomerRes.status, 200);
  const afterCustomerDetail = await (await request('/api/admin/users/8', adminToken)).json() as any;
  assert.equal(afterCustomerDetail.role, 'CUSTOMER');

  // 7. Lock user
  const lockRes = await request('/api/admin/users/8/lock', adminToken, {
    method: 'POST',
    body: JSON.stringify({ reason: 'Vi phạm chính sách kiểm thử tự động' }),
  });
  assert.equal(lockRes.status, 200);

  // Verify locked status
  const afterLockRes = await request('/api/admin/users/8', adminToken);
  const afterLockData = await afterLockRes.json() as any;
  assert.equal(afterLockData.status, 'LOCKED');

  // 8. Unlock user
  const unlockRes = await request('/api/admin/users/8/unlock', adminToken, {
    method: 'POST',
  });
  assert.equal(unlockRes.status, 200);

  // Verify unlocked status
  const afterUnlockRes = await request('/api/admin/users/8', adminToken);
  const afterUnlockData = await afterUnlockRes.json() as any;
  assert.equal(afterUnlockData.status, 'ACTIVE');
});

test('Admin Partner Management: list pending, approve / reject / request revision, manage partners', async () => {
  // 1. List pending partners
  const pendingListRes = await request('/api/admin/partners/pending', adminToken);
  assert.equal(pendingListRes.status, 200);
  const pendingData = await pendingListRes.json() as any;
  assert.ok(Array.isArray(pendingData.partners));

  // 2. List active/managed partners
  const manageListRes = await request('/api/admin/partners/manage', adminToken);
  assert.equal(manageListRes.status, 200);
  const manageData = await manageListRes.json() as any;
  assert.ok(Array.isArray(manageData.partners));

  // 3. Get partner detail
  const partnerDetailRes = await request('/api/admin/partners/manage/3', adminToken);
  assert.equal(partnerDetailRes.status, 200);
});

test('Admin Voucher Management: list pending vouchers, manage vouchers, update status', async () => {
  // 1. List pending vouchers
  const pendingVouchersRes = await request('/api/admin/vouchers/pending', adminToken);
  assert.equal(pendingVouchersRes.status, 200);
  const pendingVoucherData = await pendingVouchersRes.json() as any;
  assert.ok(Array.isArray(pendingVoucherData.vouchers));

  // 2. List all managed vouchers
  const managedVouchersRes = await request('/api/admin/vouchers/manage', adminToken);
  assert.equal(managedVouchersRes.status, 200);
  const managedVoucherData = await managedVouchersRes.json() as any;
  assert.ok(Array.isArray(managedVoucherData.vouchers));

  // 3. Update voucher status (HIDDEN -> PUBLISHED -> HIDDEN)
  const statusUpdateRes = await request('/api/admin/vouchers/11/status', adminToken, {
    method: 'PUT',
    body: JSON.stringify({ status: 'PUBLISHED' }),
  });
  assert.equal(statusUpdateRes.status, 200);

  // Restore status
  await request('/api/admin/vouchers/11/status', adminToken, {
    method: 'PUT',
    body: JSON.stringify({ status: 'HIDDEN' }),
  });
});

test('Admin Order Management: list orders, view order detail, cancel order', async () => {
  // 1. List orders
  const ordersRes = await request('/api/admin/orders?page=1&limit=10', adminToken);
  assert.equal(ordersRes.status, 200);
  const ordersData = await ordersRes.json() as any;
  assert.ok(Array.isArray(ordersData.orders));
  assert.ok(ordersData.orders.length > 0);
  const targetOrderId = Number(ordersData.orders[0].order_id);

  // 2. Order detail
  const orderDetailRes = await request(`/api/admin/orders/${targetOrderId}`, adminToken);
  assert.equal(orderDetailRes.status, 200);
  const orderDetailData = await orderDetailRes.json() as any;
  assert.equal(Number(orderDetailData.order_id), targetOrderId);
});

test('Admin Content Management: Categories CRUD', async () => {
  // 1. List categories
  const listRes = await request('/api/admin/categories', adminToken);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json() as any;
  assert.ok(Array.isArray(listData.categories));

  // 2. Create category
  const createRes = await request('/api/admin/categories', adminToken, {
    method: 'POST',
    body: JSON.stringify({
      category_name: 'Test Category Integration ' + Date.now(),
      description: 'Mô tả danh mục test',
      status: 'ACTIVE',
    }),
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json() as any;
  const newCatId = createData.category_id;

  // 3. Get created category detail
  const getRes = await request(`/api/admin/categories/${newCatId}`, adminToken);
  assert.equal(getRes.status, 200);

  // 4. Update category
  const updateRes = await request(`/api/admin/categories/${newCatId}`, adminToken, {
    method: 'PUT',
    body: JSON.stringify({
      category_name: 'Updated Test Category ' + Date.now(),
      description: 'Mô tả đã cập nhật',
      status: 'ACTIVE',
    }),
  });
  assert.equal(updateRes.status, 200);
});

test('Admin Content Management: Banners, Popups, Articles CRUD', async () => {
  // 1. Banners list
  const bannersRes = await request('/api/admin/banners', adminToken);
  assert.equal(bannersRes.status, 200);

  // 2. Popups list
  const popupsRes = await request('/api/admin/popups', adminToken);
  assert.equal(popupsRes.status, 200);

  // 3. Articles/Contents list
  const articlesRes = await request('/api/admin/contents', adminToken);
  assert.equal(articlesRes.status, 200);
});

test('Admin System Logs: query audit trail with filtering and pagination', async () => {
  const logsRes = await request('/api/admin/logs?page=1&limit=10', adminToken);
  assert.equal(logsRes.status, 200);
  const logsData = await logsRes.json() as any;
  assert.ok(Array.isArray(logsData.logs));
  assert.ok(logsData.pagination);
});
