import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlPersistedQueriesService } from './api-int-26.service.ts';

describe('GraphqlPersistedQueriesService (API-INT-26)', () => {
  it('registers queries by sha256 hash and resolves them efficiently', () => {
    const service = new GraphqlPersistedQueriesService();
    const query = 'query GetChallenge { challenge { id title } }';
    const hash = service.registerQuery(query);

    assert.strictEqual(service.hasQuery(hash), true);
    assert.strictEqual(service.resolveQuery(hash), query);
    assert.strictEqual(service.resolveQuery('invalid-hash'), null);
  });
});
