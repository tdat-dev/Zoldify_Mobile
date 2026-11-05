// Chạy: npm test (node --test, Node tự bỏ kiểu TypeScript, không cần thêm thư viện).
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bankAccountError,
  isValidVnPhone,
  normalizeVnPhone,
  vnPhoneError,
} from '../validators.ts';

test('normalizeVnPhone bỏ ký tự phân cách và đổi +84/84 về 0', () => {
  assert.equal(normalizeVnPhone('0912 345 678'), '0912345678');
  assert.equal(normalizeVnPhone('0912.345.678'), '0912345678');
  assert.equal(normalizeVnPhone('+84 912-345-678'), '0912345678');
  assert.equal(normalizeVnPhone('84912345678'), '0912345678');
});

test('isValidVnPhone nhận số di động 10 số và số cố định 11 số', () => {
  const ok = [
    '0987654321',
    '0912000111',
    '0351234567',
    '0561234567',
    '0701234567',
    '0812345678',
    '02438123456',
    '+84987654321',
  ];
  for (const s of ok) assert.equal(isValidVnPhone(s), true, s);
});

test('isValidVnPhone chặn số sai (E2E 02/11 lưu được "123")', () => {
  const bad = ['123', '', 'abc', '091234567', '09123456789', '0112345678', '0412345678', '1912345678'];
  for (const s of bad) assert.equal(isValidVnPhone(s), false, s);
});

test('vnPhoneError trả câu báo lỗi hoặc null', () => {
  assert.equal(vnPhoneError(''), 'Nhập số điện thoại.');
  assert.match(vnPhoneError('123') ?? '', /chưa đúng/);
  assert.equal(vnPhoneError('0987654321'), null);
});

test('bankAccountError: chỉ chữ số, dài 6 đến 19', () => {
  assert.equal(bankAccountError(''), 'Nhập số tài khoản.');
  assert.equal(bankAccountError('abc'), 'Số tài khoản chỉ gồm chữ số.');
  assert.equal(bankAccountError('12a456'), 'Số tài khoản chỉ gồm chữ số.');
  assert.match(bankAccountError('12345') ?? '', /từ 6 đến 19/);
  assert.match(bankAccountError('12345678901234567890') ?? '', /từ 6 đến 19/);
  assert.equal(bankAccountError('0011004455667'), null);
  assert.equal(bankAccountError('0011 0044 5566'), null);
});
