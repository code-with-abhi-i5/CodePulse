import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcDeadlinePropagationService } from './api-int-40.service.ts';

describe('GrpcDeadlinePropagationService (API-INT-40)', () => {
  it('calculates remaining gRPC deadlines and detects expired RPC invocations', () => {
    const service = new GrpcDeadlinePropagationService();
    const now = 10000;
    const deadline = 15000;

    assert.strictEqual(service.calculateRemainingDeadlineMs(deadline, now), 5000);
    assert.strictEqual(service.isExpired(deadline, now), false);
    assert.strictEqual(service.isExpired(deadline, 16000), true);
  });
});
