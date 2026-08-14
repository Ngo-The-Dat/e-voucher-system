import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import type { Server } from 'node:http';

let server: Server;
let baseUrl = '';

const request = (path: string, init: RequestInit = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });

before(async () => {
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

test('Customer Catalog API: get public vouchers list', async () => {
  const res = await request('/api/customer/vouchers');
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(Array.isArray(data.vouchers));
  assert.ok(data.pagination);
});

test('Customer Catalog API: get categories list', async () => {
  const res = await request('/api/customer/vouchers/categories');
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.ok(Array.isArray(data.categories));
});

test('Customer Catalog API: get voucher detail', async () => {
  const listRes = await request('/api/customer/vouchers');
  const listData = (await listRes.json()) as any;

  if (listData.vouchers.length === 0) {
    console.log('Skipping voucher detail test: No published voucher found.');
    return;
  }

  const voucherId = listData.vouchers[0].id;
  const detailRes = await request(`/api/customer/vouchers/${voucherId}`);
  assert.equal(detailRes.status, 200);
  const detailData = (await detailRes.json()) as any;
  assert.equal(String(detailData.id), String(voucherId));
  assert.ok(detailData.title);
});
