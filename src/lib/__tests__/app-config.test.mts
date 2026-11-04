// Chạy: npm test.
/// <reference types="node" />
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../../../', import.meta.url);

test('bản phát hành không có route _sitemap', () => {
  const { expo } = JSON.parse(readFileSync(new URL('app.json', root), 'utf8'));
  const router = expo.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-router');
  assert.equal(router?.[1]?.sitemap, false);
});

test('link sai mở màn tiếng Việt, không phải "Unmatched Route" mặc định', () => {
  assert.ok(existsSync(new URL('src/app/+not-found.tsx', root)));
});
