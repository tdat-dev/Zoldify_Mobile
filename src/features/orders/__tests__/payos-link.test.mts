// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pickPayableLink } from '../payos-link.ts';

const pending = { paymentStatus: 'pending', payos_order_code: '3501' };
const live = { payosStatus: 'PENDING', checkoutUrl: 'https://pay.payos.vn/web/abc' };

test('link còn chờ thì dùng lại, không xin link mới', () => {
  // Tạo link mới với cùng orderCode sẽ bị PayOS từ chối.
  assert.equal(pickPayableLink(pending, live), 'https://pay.payos.vn/web/abc');
});

test('chưa từng tạo link thì phải tạo mới', () => {
  assert.equal(pickPayableLink({ paymentStatus: undefined, payos_order_code: null }, null), null);
  assert.equal(pickPayableLink(null, live), null);
});

test('link đã chết (huỷ, hết hạn, đã trả) thì tạo link mới', () => {
  for (const status of ['CANCELLED', 'EXPIRED', 'PAID']) {
    assert.equal(pickPayableLink(pending, { payosStatus: status, checkoutUrl: 'https://x' }), null, status);
  }
});

test('payment đã xong ở server thì không mở lại trang thanh toán', () => {
  for (const paymentStatus of ['success', 'failed']) {
    assert.equal(pickPayableLink({ paymentStatus, payos_order_code: '3501' }, live), null, paymentStatus);
  }
});

test('thiếu checkoutUrl thì không dùng link đó', () => {
  assert.equal(pickPayableLink(pending, { payosStatus: 'PENDING' }), null);
});

test('PayOS không trả lời trạng thái thì vẫn dùng link đã lưu', () => {
  // Backend vẫn trả checkoutUrl từ DB khi gọi PayOS lỗi: QR cũ vẫn quét được.
  assert.equal(pickPayableLink(pending, { payosStatus: null, checkoutUrl: 'https://pay.payos.vn/web/abc' }),
    'https://pay.payos.vn/web/abc');
});
