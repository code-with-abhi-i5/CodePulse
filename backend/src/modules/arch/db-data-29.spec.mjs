import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CursorStreamingSerializerService } from './db-data-29.service.ts';

describe('CursorStreamingSerializerService (DB-DATA-29)', () => {
  it('streams batches of records into valid JSON array without loading all into RAM', async () => {
    const streamer = new CursorStreamingSerializerService();
    const dataset = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' }
    ];

    const fetcher = async (size, lastId) => {
      const idx = lastId ? dataset.findIndex((d) => d.id === lastId) + 1 : 0;
      return dataset.slice(idx, idx + size);
    };

    let fullJson = '';
    for await (const chunk of streamer.streamJsonRows(fetcher, 2)) {
      fullJson += chunk;
    }

    const parsed = JSON.parse(fullJson);
    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[0].name, 'Item 1');
  });
});
