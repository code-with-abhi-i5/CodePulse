import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AutomatedSecretScannerService } from './sec-auth-27.service.ts';

describe('AutomatedSecretScannerService (SEC-AUTH-27)', () => {
  it('detects high-entropy API keys and private keys in staged git diffs', () => {
    const scanner = new AutomatedSecretScannerService();

    const leakDiff = '+ const token = "ghp_1234567890abcdef1234567890abcdef1234";';
    const leakRes = scanner.scanDiff(leakDiff);
    assert.strictEqual(leakRes.hasSecretLeak, true);
    assert.ok(leakRes.findings[0].includes('GitHub Personal Access Token'));

    const cleanDiff = '+ const normalVar = "just a string";';
    const cleanRes = scanner.scanDiff(cleanDiff);
    assert.strictEqual(cleanRes.hasSecretLeak, false);
  });
});
