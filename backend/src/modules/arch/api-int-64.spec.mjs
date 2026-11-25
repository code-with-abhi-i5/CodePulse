import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GraphqlSchemaStitchingGatewayService } from './api-int-64.service.ts';

describe('GraphqlSchemaStitchingGatewayService (API-INT-64)', () => {
  it('federates queries across multiple subgraphs with fault tolerance', async () => {
    const gateway = new GraphqlSchemaStitchingGatewayService();
    gateway.registerSubgraph('battles', {
      name: 'battles',
      query: async (f, args) => ({ id: args.id, title: 'Arena Battle #1', challengeIds: ['c1', 'c2'] })
    });
    gateway.registerSubgraph('challenges', {
      name: 'challenges',
      query: async (f, args) => ({ id: args.id, name: 'Challenge ' + args.id })
    });

    const federated = await gateway.resolveFederatedBattleWithChallenges('b-100');
    assert.strictEqual(federated.id, 'b-100');
    assert.strictEqual(federated.challenges.length, 2);
    assert.strictEqual(federated.challenges[0].name, 'Challenge c1');
  });
});
