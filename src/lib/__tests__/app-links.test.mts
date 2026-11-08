// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { duongDanTrongApp, linkWebZoldify } from '../app-links.ts';

const root = new URL('../../../', import.meta.url);

const moWeb = (url: string) => `/open-web?url=${encodeURIComponent(url)}`;

test('link món hàng của web mở màn món hàng, bỏ tham số theo dõi', () => {
  assert.equal(duongDanTrongApp('https://zoldify.com/iphone-16-pro-max-256gb-i1'), '/products/1');
  assert.equal(duongDanTrongApp('https://zoldify.com/ao-khoac-i42?spm=home&pvid=x'), '/products/42');
  assert.equal(duongDanTrongApp('https://www.zoldify.com/pdp-i7'), '/products/7');
});

test('link chia sẻ cũ /product/{mã} và /product/{tên}-i{mã} cũng mở màn món hàng', () => {
  assert.equal(duongDanTrongApp('https://zoldify.com/product/5'), '/products/5');
  assert.equal(duongDanTrongApp('https://zoldify.com/product/may-anh-i5'), '/products/5');
});

test('link shop mở màn shop', () => {
  assert.equal(duongDanTrongApp('https://zoldify.com/shop/shop-zoldify-1'), '/shop/1');
  assert.equal(duongDanTrongApp('https://zoldify.com/shop/9'), '/shop/9');
});

test('link web app chưa có màn riêng thì mở trang web trong app, không rơi vào màn lỗi', () => {
  for (const url of [
    'https://zoldify.com/product/create',
    'https://zoldify.com/product/5/edit',
    'https://zoldify.com/shop/orders',
    'https://zoldify.com/dien-thoai/apple',
    'https://zoldify.com/hang-i0',
  ]) {
    assert.equal(duongDanTrongApp(url), moWeb(url), url);
  }
});

test('đường dẫn trong app và link tên miền khác giữ nguyên', () => {
  for (const p of ['/products/3', '/shop/12', 'zoldify://products/3', '/', 'https://evil.com/x-i1', '']) {
    assert.equal(duongDanTrongApp(p), p, p);
  }
});

test('màn mở web chỉ nhận link https của zoldify.com', () => {
  assert.equal(linkWebZoldify('https://zoldify.com/dien-thoai/apple'), 'https://zoldify.com/dien-thoai/apple');
  assert.equal(linkWebZoldify('https://www.zoldify.com/a'), 'https://www.zoldify.com/a');
  for (const bad of ['https://evil.com/a', 'http://zoldify.com/a', 'javascript:alert(1)', 'https://zoldify.com.evil.com/a', undefined, '']) {
    assert.equal(linkWebZoldify(bad), null, String(bad));
  }
});

test('app.json khai App Links tự xác minh cho đúng link món hàng, link cũ và shop', () => {
  const { expo } = JSON.parse(readFileSync(new URL('app.json', root), 'utf8'));
  const filters = (expo.android.intentFilters ?? []).filter((f: { autoVerify?: boolean }) => f.autoVerify);
  assert.equal(filters.length, 1);
  const data = filters[0].data as Record<string, string>[];
  // Chỉ zoldify.com: www chuyển hướng 301 nên không xác minh được, mà Android dưới 12
  // trượt một host là bỏ xác minh cả bộ lọc.
  assert.deepEqual([...new Set(data.map((d) => d.host))], ['zoldify.com']);
  assert.deepEqual(
    data.map((d) => d.pathPattern ?? d.pathPrefix).sort(),
    ['/.*-i.*', '/product/', '/shop/'],
  );
});
