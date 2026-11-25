import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedBruteForceProtectorService } from './sec-auth-28.service.ts';

describe('DistributedBruteForceProtectorService (SEC-AUTH-28)', () => {
  it('correlates distributed failed login attempts and triggers global mitigation', () => {
    const protector = new DistributedBruteForceProtectorService(3);

    assert.strictEqual(protector.recordFailure('admin@codepulse.io').isAttacked, false);
    assert.strictEqual(protector.recordFailure('admin@codepulse.io').isAttacked, false);
    const triggered = protector.recordFailure('admin@codepulse.io');

    assert.strictEqual(triggered.isAttacked, true);
    assert.strictEqual(triggered.totalFailures, 3);
  });
});
