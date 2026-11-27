import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TenantDynamicClassloaderSandbox } from './classloader-sandbox.service.ts';

describe('TenantDynamicClassloaderSandbox [ARCH-CORE-018]', () => {
  const sandbox = new TenantDynamicClassloaderSandbox();

  test('blocks attempts to load native OS bindings or file system', () => {
    const maliciousCode = 'const fs = require("fs"); fs.readFileSync("/etc/passwd");';
    const res = sandbox.executeSafely(maliciousCode);
    assert.equal(res.success, false);
    assert.ok(res.blockedCalls.includes('fs'));
  });

  test('blocks child_process execution', () => {
    const res = sandbox.executeSafely('require("child_process").execSync("whoami")');
    assert.equal(res.success, false);
    assert.ok(res.blockedCalls.includes('child_process'));
  });

  test('permits pure algorithmic computation within sandbox', () => {
    const safeCode = 'return Math.max(context.a, context.b) * 2;';
    const res = sandbox.executeSafely(safeCode, { a: 10, b: 25 });
    assert.equal(res.success, true);
    assert.equal(res.result, 50);
  });
});
