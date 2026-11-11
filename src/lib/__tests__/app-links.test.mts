// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { duongDanTrongApp } from '../app-links.ts';

const root = new URL('../../../', import.meta.url);

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

test('trang riêng của người bán trên web mở màn tương ứng trong app', () => {
  assert.equal(duongDanTrongApp('https://zoldify.com/product/create'), '/sell');
  assert.equal(duongDanTrongApp('https://zoldify.com/product/5/edit'), '/edit-product/5');
  assert.equal(duongDanTrongApp('https://zoldify.com/shop/orders'), '/sales');
  assert.equal(duongDanTrongApp('https://zoldify.com/shop/settings'), '/shop/settings');
});

// Máy ảo 08/11: bản đầu mở link lạ bằng tab trình duyệt. Không có tab Chrome thì
// expo-web-browser bắn intent VIEW, Android giao lại cho app (đã xác minh) và app
// mở web lần nữa, quay vòng không dừng. Link app nhận được phải luôn ra một màn
// trong app, không bao giờ trả về trình duyệt.
test('link web app không có màn tương ứng thì về Trang chủ, không bao giờ mở web', () => {
  for (const url of ['https://zoldify.com/dien-thoai/dell-inspiron', 'https://zoldify.com/hang-i0', 'https://zoldify.com/shop/a/b']) {
    assert.equal(duongDanTrongApp(url), '/', url);
  }
});

test('đường dẫn trong app và link tên miền khác giữ nguyên', () => {
  for (const p of ['/products/3', '/shop/12', 'zoldify://products/3', '/', 'https://evil.com/x-i1', '']) {
    assert.equal(duongDanTrongApp(p), p, p);
  }
});

test('app không còn màn mở web (nguồn của vòng lặp)', () => {
  assert.equal(existsSync(new URL('src/app/open-web.tsx', root)), false);
});

test('app.json khai App Links tự xác minh cho đúng link món hàng, link cũ và shop', () => {
  const { expo } = JSON.parse(readFileSync(new URL('app.json', root), 'utf8'));
  const filters = (expo.android.intentFilters ?? []).filter((f: { autoVerify?: boolean }) => f.autoVerify);
  assert.equal(filters.length, 1);
  const data = filters[0].data as Record<string, string>[];
  // Chỉ zoldify.com: www chuyển hướng 301 nên không xác minh được, mà Android dưới 12
  // trượt một host là bỏ xác minh cả bộ lọc.
  assert.deepEqual([...new Set(data.map((d) => d.host))], ['zoldify.com']);
  assert.deepEqual(data.filter((d) => d.pathPrefix).map((d) => d.pathPrefix).sort(), ['/product/', '/shop/']);
  assert.deepEqual(
    data.filter((d) => d.pathAdvancedPattern).map((d) => d.pathAdvancedPattern),
    ['/[a-z0-9-]*-i[1-9][0-9]*'],
  );
  // Máy ảo 08/11: mẫu `/.*-i.*` KHÔNG bắt được /iphone-16-pro-max-256gb-i1 và link
  // mở Chrome. `.*` của pathPattern dừng ở dấu `-` đầu tiên và không quay lui,
  // nên cần một mẫu cho mỗi số dấu `-` đứng trước `-i`.
  const globs = new Set(data.filter((d) => d.pathPattern).map((d) => d.pathPattern));
  for (let k = 1; k <= 40; k++) assert.ok(globs.has('/' + '.*-'.repeat(k) + 'i.*'), `thiếu mẫu ${k} dấu -`);
});

/** Mô phỏng PatternMatcher PATTERN_SIMPLE_GLOB của Android: `.*` nhảy tới lần gặp đầu
 * tiên của ký tự kế tiếp trong mẫu, không quay lui. */
function khopGlobAndroid(mau: string, chuoi: string): boolean {
  let im = 0;
  let ip = 0;
  while (ip < mau.length) {
    if (mau[ip] === '.' && mau[ip + 1] === '*') {
      ip += 2;
      if (ip >= mau.length) return true;
      while (im < chuoi.length && chuoi[im] !== mau[ip]) im++;
      continue;
    }
    if (im >= chuoi.length || (mau[ip] !== '.' && mau[ip] !== chuoi[im])) return false;
    im++;
    ip++;
  }
  return im === chuoi.length;
}

test('mẫu cho Android 11 trở xuống bắt link món hàng thật và không bắt trang khác', () => {
  const { expo } = JSON.parse(readFileSync(new URL('app.json', root), 'utf8'));
  const data = expo.android.intentFilters.find((f: { autoVerify?: boolean }) => f.autoVerify).data as Record<string, string>[];
  const khop = (p: string) =>
    data.some((d) => (d.pathPattern && khopGlobAndroid(d.pathPattern, p)) || (d.pathPrefix && p.startsWith(d.pathPrefix)));
  assert.equal(khopGlobAndroid('/.*-i.*', '/iphone-16-pro-max-256gb-i1'), false);
  for (const p of ['/iphone-16-pro-max-256gb-i1', '/ao-i2', '/may-in-hp-i5', '/product/1', '/shop/shop-zoldify-1']) {
    assert.ok(khop(p), p);
  }
  for (const p of ['/', '/login', '/cart', '/dien-thoai', '/checkout', '/payment/result', '/wallet']) {
    assert.ok(!khop(p), p);
  }
});
