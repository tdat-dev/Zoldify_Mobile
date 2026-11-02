// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { boDau, compareVi, matchesVi, sortByNameVi } from '../text.ts';

test('boDau bỏ dấu và đổi đ/Đ', () => {
  assert.equal(boDau('Hà Nội'), 'ha noi');
  assert.equal(boDau('Đắk Lắk'), 'dak lak');
  assert.equal(boDau('  Thanh Hóa '), 'thanh hoa');
});

test('matchesVi khớp không dấu, không phân biệt hoa thường', () => {
  assert.equal(matchesVi('Hà Nội', 'ha'), true);
  assert.equal(matchesVi('Thanh Hóa', 'THANH HOA'), true);
  assert.equal(matchesVi('Đà Nẵng', 'da nang'), true);
  assert.equal(matchesVi('Hà Nội', 'hue'), false);
  assert.equal(matchesVi('Hà Nội', ''), true);
});

test('sortByNameVi sắp A-Z bỏ dấu và tiền tố hành chính (D-05)', () => {
  const provinces = ['Long An', 'Đắk Lắk', 'Lâm Đồng', 'Hồ Chí Minh', 'Hà Nội', 'An Giang', 'Thành phố Cần Thơ'];
  assert.deepEqual(sortByNameVi(provinces, (s) => s), [
    'An Giang',
    'Thành phố Cần Thơ',
    'Đắk Lắk',
    'Hà Nội',
    'Hồ Chí Minh',
    'Lâm Đồng',
    'Long An',
  ]);
});

test('compareVi so số theo giá trị', () => {
  const districts = ['Quận 10', 'Quận 2', 'Quận 1', 'Quận Gò Vấp'];
  assert.deepEqual([...districts].sort(compareVi), ['Quận 1', 'Quận 2', 'Quận 10', 'Quận Gò Vấp']);
});
