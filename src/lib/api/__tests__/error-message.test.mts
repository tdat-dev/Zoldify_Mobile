// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';

import { apiErrorMessage } from '../error-message.ts';

function httpError(status: number, message?: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data: { message },
  } as never);
}

test('mất mạng: câu tiếng Việt, không lộ "Network Error"', () => {
  const msg = apiErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'));
  assert.equal(msg, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.');
});

test('hết giờ cũng tính là không tới được máy chủ', () => {
  const msg = apiErrorMessage(new AxiosError('timeout of 20000ms exceeded', 'ECONNABORTED'));
  assert.equal(msg, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.');
});

test('500: không lộ "Internal server error" của Nest', () => {
  assert.equal(apiErrorMessage(httpError(500, 'Internal server error'), 'Vui lòng thử lại.'), 'Vui lòng thử lại.');
});

test('lỗi nghiệp vụ và bảo trì giữ nguyên câu của server', () => {
  assert.equal(apiErrorMessage(httpError(400, 'Hết hàng rồi')), 'Hết hàng rồi');
  assert.equal(apiErrorMessage(httpError(503, 'Hệ thống đang bảo trì')), 'Hệ thống đang bảo trì');
  assert.equal(apiErrorMessage(httpError(400, ['Thiếu tên'])), 'Thiếu tên');
});
