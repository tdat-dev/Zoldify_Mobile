// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isMultiSeller, sellerSubtotal } from '../seller-share.ts';

// Đủ trường cho hai hàm; ép kiểu vì `Order` sinh từ schema có nhiều trường bắt buộc.
const order = (o: Record<string, unknown>) => o as never;

test('danh sách: dùng seller_total và multi_seller backend gửi', () => {
  const o = order({ total_amount: 997800, seller_total: 199000, multi_seller: true, items: [] });
  assert.equal(sellerSubtotal(o), 199000);
  assert.equal(isMultiSeller(o), true);
});

test('chi tiết: cộng từ món đã lọc, lệch tiền hàng cả đơn là đơn chung', () => {
  const o = order({ total_amount: '997800.00', items: [{ price: '199000.00', quantity: 1 }] });
  assert.equal(sellerSubtotal(o), 199000);
  assert.equal(isMultiSeller(o), true);
});

test('đơn chỉ có hàng của mình thì không phải đơn chung', () => {
  const o = order({ total_amount: '398000.00', items: [{ price: '199000.00', quantity: 2 }] });
  assert.equal(isMultiSeller(o), false);
});
