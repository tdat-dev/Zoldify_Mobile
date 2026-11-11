// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// @ts-expect-error script .mjs của CI, không có khai báo kiểu
import { phanLoai, soanGhiChu } from '../../../scripts/ghi-chu-phat-hanh.mjs';

// Tiêu đề commit thật từ android-2026-11-07 tới 6e9bda6.
const LOG = [
  'Sửa vị trí cuộn khi mất mạng và khi có mạng',
  'fix: link app nhận được luôn mở màn trong app, bỏ màn mở web',
  'feat: thang tình trạng 6 mức có phần trăm, khớp web',
  'test: link app nhận được không bao giờ mở lại trình duyệt (đang đỏ)',
  'feat(app-links)!: link zoldify.com mở thẳng app Android (App Links)',
  'docs: ghi cách CI tự phát hành APK lên GitHub Release',
  'ci: push main build APK prod và tự tạo GitHub Release có Zoldify.apk',
  'chore(deps): bump expo',
  'refactor: tách màn chi tiết',
  '',
];

test('bỏ tiền tố commit, bỏ commit kỹ thuật, chia Mới và Sửa lỗi', () => {
  assert.deepEqual(phanLoai(LOG), {
    moi: ['Thang tình trạng 6 mức có phần trăm, khớp web', 'Link zoldify.com mở thẳng app Android (App Links)'],
    sua: ['Sửa vị trí cuộn khi mất mạng và khi có mạng', 'Link app nhận được luôn mở màn trong app, bỏ màn mở web'],
  });
});

test('ghi chú không còn chữ feat/fix nào và có hai mục', () => {
  const md = soanGhiChu(LOG);
  assert.doesNotMatch(md, /\b(feat|fix|test|docs|ci|chore)(\(|:|!)/);
  assert.match(md, /^## Có gì mới\n\n- Thang/);
  assert.match(md, /## Sửa lỗi\n\n- Sửa vị trí cuộn/);
});

test('trùng tiêu đề chỉ ghi một lần, bỏ dấu chấm cuối, viết hoa chữ đầu', () => {
  assert.deepEqual(phanLoai(['fix: ảnh bị mờ.', 'fix: Ảnh bị mờ', 'perf: mở app nhanh hơn']), {
    moi: ['Mở app nhanh hơn'],
    sua: ['Ảnh bị mờ'],
  });
});

test('chỉ có commit kỹ thuật thì ghi một dòng thay vì để trống', () => {
  assert.equal(soanGhiChu(['ci: x', 'docs: y']), '## Có gì mới\n\n- Không có thay đổi tính năng nào trong commit.\n');
});

test('chạy như CI: đọc stdin, in markdown', () => {
  const script = fileURLToPath(new URL('../../../scripts/ghi-chu-phat-hanh.mjs', import.meta.url));
  const out = execFileSync('node', [script], { input: 'feat: a\nfix: b\n', encoding: 'utf8' });
  assert.equal(out, '## Có gì mới\n\n- A\n\n## Sửa lỗi\n\n- B\n');
});
