import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiResponseCompressionNegotiatorService } from './api-int-60.service.ts';

describe('ApiResponseCompressionNegotiatorService (API-INT-60)', () => {
  it('negotiates optimal compression algorithm preferring zstd over br and gzip', () => {
    const negotiator = new ApiResponseCompressionNegotiatorService();

    assert.strictEqual(negotiator.negotiate('gzip, deflate, br, zstd'), 'zstd');
    assert.strictEqual(negotiator.negotiate('gzip, br'), 'br');
    assert.strictEqual(negotiator.negotiate('gzip'), 'gzip');
    assert.strictEqual(negotiator.negotiate(''), 'identity');
  });
});
