import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiResponseFieldFilterService } from './api-int-19.service.ts';

describe('ApiResponseFieldFilterService (API-INT-19)', () => {
  it('projects only specified fields on REST API responses', () => {
    const filter = new ApiResponseFieldFilterService();
    const payload = { id: 'c1', title: 'Binary Search', difficulty: 'EASY', tags: ['algo'], hiddenMetadata: 'secret' };

    const filtered = filter.filterFields(payload, 'id,title,difficulty');
    assert.deepStrictEqual(filtered, {
      id: 'c1',
      title: 'Binary Search',
      difficulty: 'EASY'
    });
    assert.strictEqual(filtered.hiddenMetadata, undefined);
  });
});
