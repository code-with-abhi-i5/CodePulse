import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiContentNegotiationService } from './api-int-15.service.ts';

describe('ApiContentNegotiationService (API-INT-15)', () => {
  it('resolves API versions via URL path prefix, custom header, and Accept content negotiation', () => {
    const negotiator = new ApiContentNegotiationService('v1');

    assert.strictEqual(negotiator.resolveVersion('/v2/challenges'), 'v2');
    assert.strictEqual(negotiator.resolveVersion('/challenges', undefined, 'v3'), 'v3');
    assert.strictEqual(negotiator.resolveVersion('/challenges', 'application/vnd.codepulse.v2+json'), 'v2');
    assert.strictEqual(negotiator.resolveVersion('/challenges'), 'v1');
  });
});
