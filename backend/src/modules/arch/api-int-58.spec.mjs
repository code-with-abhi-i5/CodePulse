import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RestSortParameterParserService } from './api-int-58.service.ts';

describe('RestSortParameterParserService (API-INT-58)', () => {
  it('parses multi-column ascending and descending sort parameter syntax', () => {
    const parser = new RestSortParameterParserService();
    const parsed = parser.parse('+title,-createdAt,rating');

    assert.deepStrictEqual(parsed, [
      { field: 'title', direction: 'ASC' },
      { field: 'createdAt', direction: 'DESC' },
      { field: 'rating', direction: 'ASC' }
    ]);
  });
});
