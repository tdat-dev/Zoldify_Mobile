// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/query-core';
import { AxiosError } from 'axios';

import { apiErrorMessage, isNotFoundError, shouldRetryQuery } from '../error-message.ts';

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

test('nhận ra 404, lỗi khác thì không', () => {
  assert.equal(isNotFoundError(httpError(404, 'Không tìm thấy')), true);
  assert.equal(isNotFoundError(httpError(500)), false);
  assert.equal(isNotFoundError(new AxiosError('Network Error', 'ERR_NETWORK')), false);
  assert.equal(isNotFoundError(null), false);
});

/** Đếm số lần gọi thật của query-core với luật thử lại này. */
async function callsFor(err: unknown) {
  const client = new QueryClient();
  let calls = 0;
  await client
    .fetchQuery({
      queryKey: ['x'],
      retry: shouldRetryQuery,
      retryDelay: 0,
      queryFn: () => {
        calls += 1;
        throw err;
      },
    })
    .catch(() => {});
  return calls;
}

test('404 và 401 không thử lại, mạng rớt và 5xx thử lại 2 lần', async () => {
  assert.equal(await callsFor(httpError(404)), 1);
  assert.equal(await callsFor(httpError(401)), 1);
  assert.equal(await callsFor(httpError(400)), 1);
  assert.equal(await callsFor(httpError(500)), 3);
  assert.equal(await callsFor(httpError(429)), 3);
  assert.equal(await callsFor(new AxiosError('Network Error', 'ERR_NETWORK')), 3);
});
