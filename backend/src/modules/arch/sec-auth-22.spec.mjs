import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GraphqlIntrospectionSanitizerService } from './sec-auth-22.service.ts';

describe('GraphqlIntrospectionSanitizerService (SEC-AUTH-22)', () => {
  it('blocks introspection queries in production and allows standard user queries', () => {
    const sanitizer = new GraphqlIntrospectionSanitizerService(true);

    const introspectionQuery = 'query { __schema { types { name } } }';
    const badRes = sanitizer.validateQuery(introspectionQuery);
    assert.strictEqual(badRes.isAllowed, false);
    assert.ok(badRes.error.includes('Introspection is disabled in production'));

    const userQuery = 'query GetChallenges { challenges { id title } }';
    const goodRes = sanitizer.validateQuery(userQuery);
    assert.strictEqual(goodRes.isAllowed, true);
  });
});
