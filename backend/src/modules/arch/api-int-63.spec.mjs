import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RestApiBulkImportStreamerService } from './api-int-63.service.ts';

describe('RestApiBulkImportStreamerService (API-INT-63)', () => {
  it('streams and validates jsonlines with detailed per-item error reporting', () => {
    const service = new RestApiBulkImportStreamerService();
    const ndjson = [
      '{"id":1,"name":"Alice"}',
      '{"id":2,"name":""}', // invalid name
      'not a json line',      // malformed
      '{"id":3,"name":"Charlie"}'
    ].join('\n');

    const validator = (rec) => {
      if (!rec || typeof rec.id !== 'number' || !rec.name || rec.name.length === 0) {
        return { valid: false, error: 'Name must be non-empty string' };
      }
      return { valid: true, value: rec };
    };

    const result = service.parseAndValidateJsonLines(ndjson, validator);
    assert.strictEqual(result.totalProcessed, 4);
    assert.strictEqual(result.validItems.length, 2);
    assert.strictEqual(result.errors.length, 2);
    assert.strictEqual(result.errors[0].lineNumber, 2);
    assert.strictEqual(result.errors[1].lineNumber, 3);
  });
});
