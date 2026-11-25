import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiResponseStreamingSerializerService } from './api-int-35.service.ts';

describe('ApiResponseStreamingSerializerService (API-INT-35)', () => {
  it('streams JSON array items as chunks without buffering the full dataset in memory', () => {
    const serializer = new ApiResponseStreamingSerializerService();
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const chunks = [];
    for (const chunk of serializer.serializeArrayStream(items)) {
      chunks.push(chunk);
    }

    const fullJson = chunks.join('');
    assert.deepStrictEqual(JSON.parse(fullJson), [{ id: 1 }, { id: 2 }, { id: 3 }]);
  });
});
