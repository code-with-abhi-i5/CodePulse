import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveFederatedQueryPlanner } from './federated-query-planner.service.ts';

describe('AdaptiveFederatedQueryPlanner [ARCH-CORE-019]', () => {
  test('decomposes queries targeting specific partition to corresponding nodes', () => {
    const planner = new AdaptiveFederatedQueryPlanner();
    planner.registerNode({ id: 'node_us_east', region: 'us-east', partitions: ['tenant_100', 'tenant_101'] });
    planner.registerNode({ id: 'node_eu_west', region: 'eu-west', partitions: ['tenant_200'] });

    const plans = planner.planQuery('tournaments', 'tenant_100', ['score > 50'], 'COUNT');
    assert.equal(plans.length, 1);
    assert.equal(plans[0].nodeId, 'node_us_east');
    assert.equal(plans[0].pushdownFilters[0], 'score > 50');
  });

  test('merges federated partition results correctly', () => {
    const planner = new AdaptiveFederatedQueryPlanner();
    const merged = planner.mergeResults([[10, 40], [5, 25, 90]]);
    assert.deepEqual(merged, [5, 10, 25, 40, 90]);
  });
});
