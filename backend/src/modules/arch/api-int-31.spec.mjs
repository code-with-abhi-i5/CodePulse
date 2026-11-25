import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiConditionalGetEtagService } from './api-int-31.service.ts';

describe('ApiConditionalGetEtagService (API-INT-31)', () => {
  it('computes ETags and detects 304 Not Modified matches', () => {
    const etagService = new ApiConditionalGetEtagService();
    const body = JSON.stringify({ id: 10, name: 'Challenge A' });
    const etag = etagService.computeEtag(body);

    assert.strictEqual(etagService.shouldReturnNotModified(etag, etag), true);
    assert.strictEqual(etagService.shouldReturnNotModified(etag, '"stale-hash"'), false);
    assert.strictEqual(etagService.shouldReturnNotModified(etag, '*'), true);
  });
});
