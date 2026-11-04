// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { loginPromptFor } from '../guest-access.ts';

const appDir = fileURLToPath(new URL('../../../app/(app)', import.meta.url));

/** Tên route đúng như navigator thấy: 'orders/[id]', 'sales/index', tab 'orders'. */
function routeNames(): string[] {
  const files = readdirSync(appDir, { recursive: true, encoding: 'utf8' });
  return files
    .map((f) => f.split(sep).join('/'))
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('_layout.tsx'))
    .map((f) => f.replace(/\.tsx$/, '').replace(/^\(tabs\)\//, ''));
}

const PUBLIC = [
  '(tabs)',
  'index',
  'account',
  'products/[id]',
  'shop/[id]',
  'search',
  'browse',
  'category/[id]',
  'reviews/[id]',
  'saved',
];

test('khách vẫn xem được sản phẩm, shop, tìm kiếm', () => {
  for (const name of PUBLIC) assert.equal(loginPromptFor(name), null, name);
});

test('route có dữ liệu riêng của người dùng thì khách bị mời đăng nhập', () => {
  for (const name of ['orders/[id]', 'sales/index', 'sales/[id]', 'orders', 'cart', 'wallet']) {
    assert.ok(loginPromptFor(name), name);
  }
});

test('route mới chưa khai vẫn bị chặn, không lọt ra cho khách', () => {
  assert.ok(loginPromptFor('man-moi-chua-khai'));
});

test('mọi route trong (app) đã được xếp, route cần đăng nhập có tiêu đề riêng', () => {
  const fallback = loginPromptFor('man-moi-chua-khai');
  const names = routeNames();
  assert.ok(names.includes('orders/[id]') && names.includes('sales/index'));
  for (const name of names) {
    if (PUBLIC.includes(name)) continue;
    const prompt = loginPromptFor(name);
    assert.ok(prompt && prompt !== fallback, `chưa khai tiêu đề cho route ${name}`);
  }
});
