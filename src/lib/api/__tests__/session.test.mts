// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/query-core';

import { isSessionRejected, resetSessionCache } from '../session.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('chỉ token ĐANG LƯU bị từ chối mới là hết phiên', () => {
  assert.equal(isSessionRejected('Bearer abc', 'abc'), true);
  assert.equal(isSessionRejected('bearer abc', 'abc'), true);
});

test('401 của request không mang token không phải hết phiên', () => {
  // Khách, sai mật khẩu, hoặc DELETE push-token đi ra sau khi token đã bị xoá.
  assert.equal(isSessionRejected(undefined, null), false);
  assert.equal(isSessionRejected(undefined, 'abc'), false);
  assert.equal(isSessionRejected('', 'abc'), false);
});

test('request bay từ phiên cũ không đá phiên mới, không báo hết phiên hai lần', () => {
  assert.equal(isSessionRejected('Bearer cu', 'moi'), false);
  assert.equal(isSessionRejected('Bearer cu', null), false);
});

test('lý do không dùng clear(): query đang tải của màn đang mở treo mãi ở pending', async () => {
  const client = new QueryClient();
  const observer = new QueryObserver(client, {
    queryKey: ['product', 5],
    queryFn: async () => {
      await sleep(5);
      return { id: 5 };
    },
  });
  const stop = observer.subscribe(() => {});
  client.clear();
  await sleep(30);
  assert.equal(observer.getCurrentResult().isPending, true);
  stop();
});

test('hết phiên hai lần liên tiếp lúc đang tải: màn đang mở vẫn có dữ liệu', async () => {
  const client = new QueryClient();
  let calls = 0;
  const observer = new QueryObserver(client, {
    queryKey: ['product', 5],
    queryFn: async () => {
      calls += 1;
      await sleep(5);
      return { id: 5 };
    },
  });
  const stop = observer.subscribe(() => {});
  await sleep(20);

  resetSessionCache(client);
  await sleep(1);
  resetSessionCache(client);
  await sleep(30);

  const result = observer.getCurrentResult();
  assert.equal(result.isPending, false);
  assert.deepEqual(result.data, { id: 5 });
  assert.ok(calls >= 2);
  stop();
});

test('không còn dữ liệu của người trước: query có màn xem lẫn không có màn xem', async () => {
  const client = new QueryClient();
  client.setQueryData(['orders', 'list'], [{ id: 1 }]);
  const observer = new QueryObserver(client, {
    queryKey: ['cart', 'count'],
    queryFn: async () => 0,
    enabled: false,
  });
  client.setQueryData(['cart', 'count'], 7);
  const stop = observer.subscribe(() => {});

  resetSessionCache(client);
  await sleep(5);

  assert.equal(client.getQueryData(['orders', 'list']), undefined);
  assert.equal(client.getQueryData(['cart', 'count']), undefined);
  assert.equal(observer.getCurrentResult().data, undefined);
  stop();
});

test('query bị tắt không tự tải lại sau khi xoá', async () => {
  const client = new QueryClient();
  let calls = 0;
  const observer = new QueryObserver(client, {
    queryKey: ['cart', 'count'],
    queryFn: async () => {
      calls += 1;
      return 0;
    },
    enabled: false,
  });
  const stop = observer.subscribe(() => {});
  resetSessionCache(client);
  await sleep(5);
  assert.equal(calls, 0);
  stop();
});

test('kết quả về muộn của phiên cũ không ghi đè lại vào cache', async () => {
  const client = new QueryClient();
  let owner = 'A';
  const observer = new QueryObserver(client, {
    queryKey: ['profile'],
    queryFn: async () => {
      const who = owner;
      await sleep(10);
      return who;
    },
  });
  const stop = observer.subscribe(() => {});
  await sleep(1);
  owner = 'guest';
  resetSessionCache(client);
  await sleep(30);
  assert.equal(client.getQueryData(['profile']), 'guest');
  stop();
});

test('thao tác ghi đang chạy vẫn gọi onSettled để màn nhả nút', async () => {
  const client = new QueryClient();
  const observer = new MutationObserver(client, {
    mutationFn: async () => {
      await sleep(5);
      resetSessionCache(client);
      throw new Error('401');
    },
  });
  const stop = observer.subscribe(() => {});
  let settled = false;
  observer.mutate(undefined, { onSettled: () => (settled = true) }).catch(() => {});
  await sleep(30);
  assert.equal(settled, true);
  stop();
});
