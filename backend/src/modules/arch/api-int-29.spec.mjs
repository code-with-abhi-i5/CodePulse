import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiCancellationPropagatorService } from './api-int-29.service.ts';

describe('ApiCancellationPropagatorService (API-INT-29)', () => {
  it('creates cooperative cancellation tokens and aborts on demand', () => {
    const propagator = new ApiCancellationPropagatorService();
    const signal = propagator.createToken('req-abc');

    assert.strictEqual(signal.aborted, false);
    propagator.cancel('req-abc', 'User navigation');
    assert.strictEqual(signal.aborted, true);
  });
});
