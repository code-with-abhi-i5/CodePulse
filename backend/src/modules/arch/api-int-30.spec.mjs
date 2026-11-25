import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlUnionTypeResolverService } from './api-int-30.service.ts';

describe('GraphqlUnionTypeResolverService (API-INT-30)', () => {
  it('resolves concrete GraphQL schema __typename for polymorphic reward union objects', () => {
    const resolver = new GraphqlUnionTypeResolverService();

    assert.strictEqual(resolver.resolveType({ id: '1', kind: 'XP' }), 'ExperiencePointsReward');
    assert.strictEqual(resolver.resolveType({ id: '2', kind: 'BADGE' }), 'BadgeReward');
    assert.strictEqual(resolver.resolveType({ id: '3', kind: 'CERTIFICATE' }), 'CertificateReward');
  });
});
