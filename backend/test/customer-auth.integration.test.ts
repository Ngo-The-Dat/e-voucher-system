import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl = '';

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
  process.env.JWT_SECRET = 'testsecret';

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

test('Customer Auth API: register new customer', async () => {
  const uniqueId = Date.now();
  const email = `testcustomer_${uniqueId}@example.com`;
  const phone = `09${uniqueId.toString().slice(-8)}`;

  const res = await request('/api/customer/auth/register', undefined, {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Nguyễn Văn Đăng Ký',
      email,
      phone,
      password: 'password123',
    }),
  });

  assert.equal(res.status, 201);
  const data = (await res.json()) as any;
  assert.ok(data.token);
  assert.equal(data.user.email, email);
  assert.equal(data.user.role, 'CUSTOMER');
});

test('Customer Auth API: login existing customer', async () => {
  const email = `login_test_${Date.now()}@example.com`;
  const password = 'mypassword123';

  // 1. Register
  const regRes = await request('/api/customer/auth/register', undefined, {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Test Login User',
      email,
      password,
    }),
  });
  assert.equal(regRes.status, 201);

  // 2. Login
  const loginRes = await request('/api/customer/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  assert.equal(loginRes.status, 200);
  const loginData = (await loginRes.json()) as any;
  assert.ok(loginData.token);
  assert.equal(loginData.user.email, email);

  // 3. Get profile with token
  const meRes = await request('/api/customer/auth/me', loginData.token);
  assert.equal(meRes.status, 200);
  const meData = (await meRes.json()) as any;
  assert.equal(meData.email, email);
});

test('Customer Auth API: login with invalid credentials', async () => {
  const res = await request('/api/customer/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    }),
  });

  assert.equal(res.status, 401);
});
