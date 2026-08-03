import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import test from 'node:test';

import { resolveRequestPath } from './serve.mjs';

const root = resolve('test-fixtures', 'site');

test('maps root and asset requests inside the configured site root', () => {
  assert.equal(resolveRequestPath(root, '/'), join(root, 'index.html'));
  assert.equal(
    resolveRequestPath(root, '/assets/app.js?cache=1'),
    join(root, 'assets', 'app.js'),
  );
});

test('rejects traversal into a sibling path with the same prefix', () => {
  assert.equal(resolveRequestPath(root, '/../site-secret.txt'), null);
  assert.equal(resolveRequestPath(root, '/%2e%2e/site-secret.txt'), null);
});

test('treats backslashes as path separators before containment checks', () => {
  assert.equal(resolveRequestPath(root, '/..\\site-secret.txt'), null);
  assert.equal(resolveRequestPath(root, '/%2e%2e%5csite-secret.txt'), null);
});
