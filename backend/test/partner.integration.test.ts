import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';

const TEST_CODE = 'TEST-PARTNER-REDEEM-RACE';
const EARLY_TEST_CODE = 'TEST-PARTNER-REDEEM-EARLY';
const TEST_EMAIL = 'test.partner.integration@example.com';
const PROFILE_TEST_EMAIL = 'test.partner.profile@example.com';
const PROFILE_TEST_TAX_CODE = 'TEST-PARTNER-PROFILE-TAX';
let server: ReturnType<typeof app.listen>;
let baseUrl: string;
let partnerToken: string;
let profileToken: string;
let createdProgramId: number | undefined;
let earlyProgramId: number | undefined;

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
  partnerToken = jwt.sign({ id: 3, role: 'PARTNER' }, secret, { expiresIn: '5m' });

  await pool.query('DELETE FROM partners WHERE user_id IN (SELECT user_id FROM users WHERE email = $1)', [PROFILE_TEST_EMAIL]);
  await pool.query('DELETE FROM users WHERE email = $1', [PROFILE_TEST_EMAIL]);
  const profileUser = await pool.query(
    `INSERT INTO users
       (full_name, email, phone, identity_no, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5, 'PARTNER', 'ACTIVE')
     RETURNING user_id`,
    ['Profile Representative', PROFILE_TEST_EMAIL, '0911111111', '079111111111', 'unused-test-hash']
  );
  const profileUserId = Number(profileUser.rows[0].user_id);
  await pool.query(
    `INSERT INTO partners
       (user_id, business_name, tax_code, approval_status, activity_status, representative_title)
     VALUES ($1, $2, $3, 'APPROVED', 'ACTIVE', $4)`,
    [profileUserId, 'Profile Test Business', PROFILE_TEST_TAX_CODE, 'Giám đốc']
  );
  profileToken = jwt.sign({ id: profileUserId, role: 'PARTNER' }, secret, { expiresIn: '5m' });

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  await pool.query('DELETE FROM partners WHERE user_id IN (SELECT user_id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.query('DELETE FROM issued_vouchers WHERE voucher_code = $1', [TEST_CODE]);
  await pool.query(
    `SELECT setval(
       pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'),
       COALESCE((SELECT MAX(approval_request_id) FROM voucher_approval_requests), 1)
     )`
  );
  await pool.query(
    `INSERT INTO issued_vouchers
       (program_id, order_item_id, owner_user_id, voucher_code, usage_status, expires_at)
     VALUES (1, 1, 8, $1, 'UNUSED', NOW() + INTERVAL '1 day')`,
    [TEST_CODE]
  );

  const earlyProgram = await pool.query(
    `INSERT INTO voucher_programs
       (partner_id, category_id, program_name, original_price, sale_price,
        issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status)
     VALUES (3, 1, 'TEST future-use voucher', 100000, 80000,
             1, NOW(), NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day',
             NOW() + INTERVAL '2 days', 'PUBLISHED')
     RETURNING program_id`
  );
  earlyProgramId = Number(earlyProgram.rows[0].program_id);
  await pool.query(
    'INSERT INTO voucher_program_branches (program_id, branch_id) VALUES ($1, 1)',
    [earlyProgramId]
  );
  await pool.query(
    `INSERT INTO issued_vouchers
       (program_id, order_item_id, owner_user_id, voucher_code, usage_status, expires_at)
     VALUES ($1, 1, 8, $2, 'UNUSED', NOW() + INTERVAL '2 days')`,
    [earlyProgramId, EARLY_TEST_CODE]
  );
});

after(async () => {
  await pool.query('DELETE FROM issued_vouchers WHERE voucher_code = $1', [TEST_CODE]);
  await pool.query('DELETE FROM issued_vouchers WHERE voucher_code = $1', [EARLY_TEST_CODE]);
  if (earlyProgramId) {
    await pool.query('DELETE FROM voucher_program_branches WHERE program_id = $1', [earlyProgramId]);
    await pool.query('DELETE FROM voucher_programs WHERE program_id = $1', [earlyProgramId]);
  }
  if (createdProgramId) {
    await pool.query('DELETE FROM voucher_approval_requests WHERE program_id = $1', [createdProgramId]);
    await pool.query('DELETE FROM voucher_program_branches WHERE program_id = $1', [createdProgramId]);
    await pool.query('DELETE FROM voucher_programs WHERE program_id = $1', [createdProgramId]);
  }
  await pool.query('DELETE FROM partners WHERE user_id IN (SELECT user_id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.query('DELETE FROM partners WHERE tax_code = $1', [PROFILE_TEST_TAX_CODE]);
  await pool.query('DELETE FROM users WHERE email = $1', [PROFILE_TEST_EMAIL]);
  await new Promise<void>((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve())
  );
  await pool.end();
});

test('protected routes reject unauthenticated requests', async () => {
  const response = await request('/api/partner/profile');
  assert.equal(response.status, 401);
  assert.equal(response.headers.has('x-powered-by'), false);
  assert.ok(response.headers.get('x-content-type-options'));
});

test('partner profile reuses user identity fields and only stores representative title', async () => {
  const getResponse = await request('/api/partner/profile', profileToken);
  assert.equal(getResponse.status, 200);
  const initial = await getResponse.json() as Record<string, string>;
  assert.equal(initial.full_name, 'Profile Representative');
  assert.equal(initial.email, PROFILE_TEST_EMAIL);
  assert.equal(initial.phone, '0911111111');
  assert.equal(initial.identity_no, '079111111111');
  assert.equal(initial.representative_title, 'Giám đốc');
  assert.equal('representative_full_name' in initial, false);

  const invalidUpdate = await request('/api/partner/profile', profileToken, {
    method: 'PUT',
    body: JSON.stringify({ full_name: { unexpected: true } }),
  });
  assert.equal(invalidUpdate.status, 400);

  const updateResponse = await request('/api/partner/profile', profileToken, {
    method: 'PUT',
    body: JSON.stringify({
      full_name: 'Updated Representative',
      phone: '0922222222',
      identity_no: '079222222222',
      representative_title: 'Tổng giám đốc',
      email: 'ignored.profile.email@example.com',
    }),
  });
  assert.equal(updateResponse.status, 200);

  const stored = await pool.query(
    `SELECT u.full_name, u.email, u.phone, u.identity_no, p.representative_title
     FROM users u
     JOIN partners p ON p.user_id = u.user_id
     WHERE u.email = $1`,
    [PROFILE_TEST_EMAIL]
  );
  assert.deepEqual(stored.rows[0], {
    full_name: 'Updated Representative',
    email: PROFILE_TEST_EMAIL,
    phone: '0922222222',
    identity_no: '079222222222',
    representative_title: 'Tổng giám đốc',
  });

  const duplicateResponse = await request('/api/partner/profile', profileToken, {
    method: 'PUT',
    body: JSON.stringify({ phone: '0902000001' }),
  });
  assert.equal(duplicateResponse.status, 409);
});

test('registration validates input, handles duplicates, and blocks pending login', async () => {
  const weakPassword = await request('/api/partner/auth/register', undefined, {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Test Partner', email: TEST_EMAIL, password: 'short',
      business_name: 'Test Business', tax_code: 'TEST-INTEGRATION-TAX',
    }),
  });
  assert.equal(weakPassword.status, 400);

  const body = JSON.stringify({
    full_name: 'Test Partner', email: TEST_EMAIL, password: 'SecurePass123!',
    business_name: 'Test Business', tax_code: 'TEST-INTEGRATION-TAX',
  });
  assert.equal((await request('/api/partner/auth/register', undefined, { method: 'POST', body })).status, 201);
  assert.equal((await request('/api/partner/auth/register', undefined, { method: 'POST', body })).status, 409);

  const login = await request('/api/partner/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL.toUpperCase(), password: 'SecurePass123!' }),
  });
  assert.equal(login.status, 403);
});

test('malformed JSON receives a JSON 400 response', async () => {
  const response = await request('/api/partner/auth/login', undefined, {
    method: 'POST',
    body: '{bad json',
  });
  assert.equal(response.status, 400);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
});

test('partner data is isolated by ownership', async () => {
  assert.equal((await request('/api/partner/vouchers/3', partnerToken)).status, 404);
  assert.equal((await request('/api/partner/branches/3', partnerToken)).status, 404);
});

test('partner update endpoints reject malformed runtime payloads', async () => {
  const emptyBranchName = await request('/api/partner/branches/1', partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ branch_name: '' }),
  });
  assert.equal(emptyBranchName.status, 400);
});

test('voucher image endpoints validate authentication, files, ownership, status, and ordering payloads', async () => {
  assert.equal((await request('/api/partner/vouchers/1/images', undefined, { method: 'POST' })).status, 401);
  assert.equal((await request('/api/partner/vouchers/1/images', partnerToken, { method: 'POST' })).status, 400);

  const unsupportedForm = new FormData();
  unsupportedForm.append('image', new Blob(['not-an-image'], { type: 'text/plain' }), 'voucher.txt');
  const unsupported = await fetch(`${baseUrl}/api/partner/vouchers/1/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${partnerToken}` },
    body: unsupportedForm,
  });
  assert.equal(unsupported.status, 400);

  const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const otherPartnerForm = new FormData();
  otherPartnerForm.append('image', new Blob([pngBytes], { type: 'image/png' }), 'voucher.png');
  const otherPartner = await fetch(`${baseUrl}/api/partner/vouchers/5/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${partnerToken}` },
    body: otherPartnerForm,
  });
  assert.equal(otherPartner.status, 404);

  const publishedForm = new FormData();
  publishedForm.append('image', new Blob([pngBytes], { type: 'image/png' }), 'voucher.png');
  const published = await fetch(`${baseUrl}/api/partner/vouchers/1/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${partnerToken}` },
    body: publishedForm,
  });
  assert.equal(published.status, 400);

  const malformedOrder = await request('/api/partner/vouchers/1/images/order', partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ image_ids: [1, 1] }),
  });
  assert.equal(malformedOrder.status, 400);
});

test('frontend reference endpoints return categories and redeem details', async () => {
  const categories = await request('/api/partner/vouchers/categories', partnerToken);
  assert.equal(categories.status, 200);
  assert.ok((await categories.json() as unknown[]).length > 0);

  const lookup = await request('/api/partner/redeem/lookup?code=VCH-FB-0002', partnerToken);
  assert.equal(lookup.status, 200);
  const body = await lookup.json() as { category_name: string; branch_names: string[] };
  assert.ok(body.category_name);
  assert.ok(body.branch_names.length > 0);
});

test('QR lookup accepts stored payload and raw code while enforcing ownership', async () => {
  assert.equal((await request('/api/partner/redeem/lookup-qr')).status, 401);
  assert.equal((await request('/api/partner/redeem/lookup-qr', partnerToken, { method: 'POST' })).status, 400);

  const invalidPayloads = [{}, { qr_value: '' }, { qr_value: 'x'.repeat(501) }];
  for (const payload of invalidPayloads) {
    const response = await request('/api/partner/redeem/lookup-qr', partnerToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 400);
  }

  const lookup = (qrValue: string) => request('/api/partner/redeem/lookup-qr', partnerToken, {
    method: 'POST',
    body: JSON.stringify({ qr_value: qrValue }),
  });
  assert.equal((await lookup('https://qr.voucher.vn/VCH-FB-0002')).status, 200);
  assert.equal((await lookup('vch-fb-0002')).status, 200);
  assert.equal((await lookup('https://qr.voucher.vn/VCH-SPA-0001')).status, 404);
  assert.equal((await lookup('not-an-e-voucher')).status, 404);
});

test('JWT role must still match the current database role', async () => {
  const forgedRoleToken = jwt.sign(
    { id: 3, role: 'PARTNER_EMPLOYEE' },
    process.env.JWT_SECRET!,
    { expiresIn: '5m' }
  );
  assert.equal((await request('/api/partner/redeem/lookup?code=VCH-FB-0002', forgedRoleToken)).status, 401);
});

test('employees cannot redeem at a branch other than their assignment', async () => {
  const employeeToken = jwt.sign(
    { id: 6, role: 'PARTNER_EMPLOYEE' },
    process.env.JWT_SECRET!,
    { expiresIn: '5m' }
  );
  const response = await request('/api/partner/redeem', employeeToken, {
    method: 'POST',
    body: JSON.stringify({ voucher_code: TEST_CODE, branch_id: 2 }),
  });
  assert.equal(response.status, 403);
});

test('employees inherit partner and assigned branch authorization status', async () => {
  const employeeToken = jwt.sign(
    { id: 6, role: 'PARTNER_EMPLOYEE' },
    process.env.JWT_SECRET!,
    { expiresIn: '5m' }
  );

  await pool.query("UPDATE partners SET activity_status = 'LOCKED' WHERE user_id = 3");
  try {
    const lockedPartner = await request(
      '/api/partner/redeem/lookup?code=VCH-FB-0002',
      employeeToken
    );
    assert.equal(lockedPartner.status, 403);
  } finally {
    await pool.query("UPDATE partners SET activity_status = 'ACTIVE' WHERE user_id = 3");
  }

  await pool.query("UPDATE branches SET status = 'INACTIVE' WHERE branch_id = 1");
  try {
    const inactiveBranch = await request(
      '/api/partner/redeem/lookup?code=VCH-FB-0002',
      employeeToken
    );
    assert.equal(inactiveBranch.status, 403);
  } finally {
    await pool.query("UPDATE branches SET status = 'ACTIVE' WHERE branch_id = 1");
  }
});

test('invalid query parameters return 400', async () => {
  assert.equal((await request('/api/partner/vouchers?page=abc', partnerToken)).status, 400);
  assert.equal((await request('/api/partner/vouchers?status=invalid', partnerToken)).status, 400);
  assert.equal((await request('/api/partner/dashboard/vouchers?program_id=abc', partnerToken)).status, 400);
});

test('voucher revenue counts paid order items exactly once', async () => {
  const response = await request('/api/partner/dashboard/vouchers?program_id=1', partnerToken);
  assert.equal(response.status, 200);
  const body = await response.json() as Array<{ revenue: string }>;
  assert.equal(Number(body[0]?.revenue), 140000);
});

test('refunded orders do not contribute to revenue', async () => {
  const token = jwt.sign({ id: 5, role: 'PARTNER' }, process.env.JWT_SECRET!, { expiresIn: '5m' });
  const response = await request('/api/partner/dashboard/vouchers?program_id=5', token);
  assert.equal(response.status, 200);
  const body = await response.json() as Array<{ revenue: string }>;
  assert.equal(Number(body[0]?.revenue), 0);
});

test('voucher validation rejects inconsistent updates and duplicate approval submission', async () => {
  const createResponse = await request('/api/partner/vouchers', partnerToken, {
    method: 'POST',
    body: JSON.stringify({
      program_name: 'TEST partner validation',
      category_id: 1,
      original_price: 100000,
      sale_price: 80000,
      issue_quantity: 10,
      sale_start_at: '2026-09-01T00:00:00Z',
      sale_end_at: '2026-10-01T00:00:00Z',
      use_start_at: '2026-09-01T00:00:00Z',
      use_end_at: '2026-11-01T00:00:00Z',
      branch_ids: [1],
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json() as { program: { program_id: string } };
  createdProgramId = Number(created.program.program_id);

  const invalidPrice = await request(`/api/partner/vouchers/${createdProgramId}`, partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ sale_price: 120000 }),
  });
  assert.equal(invalidPrice.status, 400);

  const emptyBranches = await request(`/api/partner/vouchers/${createdProgramId}`, partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ branch_ids: [] }),
  });
  assert.equal(emptyBranches.status, 400);

  const invalidName = await request(`/api/partner/vouchers/${createdProgramId}`, partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ program_name: '' }),
  });
  assert.equal(invalidName.status, 400);

  const nullBranches = await request(`/api/partner/vouchers/${createdProgramId}`, partnerToken, {
    method: 'PUT',
    body: JSON.stringify({ branch_ids: null }),
  });
  assert.equal(nullBranches.status, 400);

  const submissions = await Promise.all([
    request(`/api/partner/vouchers/${createdProgramId}/submit`, partnerToken, { method: 'POST' }),
    request(`/api/partner/vouchers/${createdProgramId}/submit`, partnerToken, { method: 'POST' }),
  ]);
  assert.deepEqual(submissions.map((response) => response.status).sort(), [200, 400]);
  const count = await pool.query(
    'SELECT COUNT(*) FROM voucher_approval_requests WHERE program_id = $1',
    [createdProgramId]
  );
  assert.equal(Number(count.rows[0]?.count), 1);
});

test('concurrent redeem requests can only consume a voucher once', async () => {
  const redeem = () => request('/api/partner/redeem', partnerToken, {
    method: 'POST',
    body: JSON.stringify({ voucher_code: TEST_CODE, branch_id: 1 }),
  });
  const responses = await Promise.all([redeem(), redeem()]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);

  const result = await pool.query(
    'SELECT usage_status FROM issued_vouchers WHERE voucher_code = $1',
    [TEST_CODE]
  );
  assert.equal(result.rows[0]?.usage_status, 'USED');
});

test('voucher cannot be redeemed before its use period starts', async () => {
  const response = await request('/api/partner/redeem', partnerToken, {
    method: 'POST',
    body: JSON.stringify({ voucher_code: EARLY_TEST_CODE, branch_id: 1 }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Voucher chưa đến thời gian sử dụng.' });

  const result = await pool.query(
    'SELECT usage_status FROM issued_vouchers WHERE voucher_code = $1',
    [EARLY_TEST_CODE]
  );
  assert.equal(result.rows[0]?.usage_status, 'UNUSED');
});
