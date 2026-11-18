// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GIA_TOI_DA, locGia, loiGia } from '../price-input.ts';

// Ba chuỗi trong báo cáo V2 từng lọt qua ô giá màn đăng bán mà không báo lỗi:
// "1.5" (giá lẻ đồng), "1e3" (`Number` hiểu là 1000) và một số 17 chữ số vượt
// cả cột DECIMAL(15,2) của backend.
test('lọc lúc gõ: chỉ giữ chữ số, giống ô số lượng', () => {
  assert.equal(locGia('1.5'), '15');
  assert.equal(locGia('1e3'), '13');
  assert.equal(locGia('150.000'), '150000');
  assert.equal(locGia('150,000đ'), '150000');
  assert.equal(locGia(' 2 500 '), '2500');
  assert.equal(locGia('abc'), '');
});

test('lọc lúc gõ: không cho gõ quá số chữ số của giá trần', () => {
  // Dán "99999999999999999" thì cắt lại, không thành một số khổng lồ.
  const cat = locGia('99999999999999999');
  assert.equal(cat.length, String(GIA_TOI_DA).length);
});

test('kiểm lúc lưu: giá hợp lệ thì không có lỗi', () => {
  assert.equal(loiGia('1'), undefined);
  assert.equal(loiGia('150000'), undefined);
  assert.equal(loiGia(String(GIA_TOI_DA)), undefined);
});

test('kiểm lúc lưu: chặn đúng các chuỗi trong báo cáo', () => {
  // Kiểm chuỗi thô, không qua bộ lọc: giá có thể vào state bằng đường khác
  // ô nhập (nạp từ server, bàn phím lạ, autofill).
  for (const bay of ['1.5', '1e3', '99999999999999999', 'abc', '-5', '0', '', '  ', '0x10', 'Infinity']) {
    assert.ok(loiGia(bay), `"${bay}" phải bị chặn`);
  }
});

test('kiểm lúc lưu: quá giá trần thì nói rõ trần là bao nhiêu', () => {
  const loi = loiGia(String(GIA_TOI_DA + 1));
  assert.ok(loi);
  assert.match(loi, /10\.000\.000\.000/);
});
