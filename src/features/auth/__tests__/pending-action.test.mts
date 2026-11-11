// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  peekPendingAuthAction,
  setPendingAuthAction,
  takePendingAuthAction,
} from '../pending-action.ts';

test('hành động khách bấm được giữ tới khi đăng nhập xong mới lấy đi', () => {
  setPendingAuthAction({ kind: 'addToCart', productId: 42, quantity: 2 });
  assert.deepEqual(peekPendingAuthAction(), { kind: 'addToCart', productId: 42, quantity: 2 });
  // finishLogin lấy một lần là hết — không chạy lại lần hai.
  assert.deepEqual(takePendingAuthAction(), { kind: 'addToCart', productId: 42, quantity: 2 });
  assert.equal(takePendingAuthAction(), null);
  assert.equal(peekPendingAuthAction(), null);
});

test('bấm thêm lần nữa thì ý định cũ bị thay bằng ý định mới nhất', () => {
  setPendingAuthAction({ kind: 'addToCart', productId: 7, quantity: 1 });
  setPendingAuthAction({ kind: 'buyNow', productId: 9, quantity: 3 });
  assert.deepEqual(takePendingAuthAction(), { kind: 'buyNow', productId: 9, quantity: 3 });
  assert.equal(takePendingAuthAction(), null);
});

test('mua ngay cũng giữ được như thêm vào giỏ', () => {
  setPendingAuthAction({ kind: 'buyNow', productId: 5, quantity: 1 });
  const action = takePendingAuthAction();
  assert.equal(action?.kind, 'buyNow');
  assert.equal(action?.productId, 5);
});
