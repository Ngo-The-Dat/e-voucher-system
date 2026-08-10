import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/config/db.js';

const TEST_CODE = 'TEST-PARTNER-REDEEM-RACE';
const TEST_EMAIL = 'test.partner.integration@example.com';
let server: ReturnType<typeof app.listen>;
let baseUrl: string;
let partnerToken: string;
let createdProgramId: number | undefined;

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
});

after(async () => {
  await pool.query('DELETE FROM issued_vouchers WHERE voucher_code = $1', [TEST_CODE]);
  if (createdProgramId) {
    await pool.query('DELETE FROM voucher_approval_requests WHERE program_id = $1', [createdProgramId]);
    await pool.query('DELETE FROM voucher_program_branches WHERE program_id = $1', [createdProgramId]);
    await pool.query('DELETE FROM voucher_programs WHERE program_id = $1', [createdProgramId]);
  }
  await pool.query('DELETE FROM partners WHERE user_id IN (SELECT user_id FROM users WHERE email = $1)', [TEST_EMAIL]);
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
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
