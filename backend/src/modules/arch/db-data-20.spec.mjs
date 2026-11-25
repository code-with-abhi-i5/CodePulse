import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MultiRegionConflictResolverService } from './db-data-20.service.ts';

describe('MultiRegionConflictResolverService (DB-DATA-20)', () => {
  it('resolves concurrent multi-region updates using vector clock dominance and LWW', () => {
    const resolver = new MultiRegionConflictResolverService();

    // Case 1: Record A clearly dominates Record B in vector clock
    const recA = { id: '1', region: 'us-east', vectorClock: { 'us-east': 2, 'eu-west': 1 }, timestamp: 100, data: { name: 'A' } };
    const recB = { id: '1', region: 'eu-west', vectorClock: { 'us-east': 1, 'eu-west': 1 }, timestamp: 120, data: { name: 'B' } };
    assert.strictEqual(resolver.resolveConflict(recA, recB).data.name, 'A');

    // Case 2: Concurrent divergence -> LWW tie-break
    const concurrentA = { id: '2', region: 'us-east', vectorClock: { 'us-east': 2 }, timestamp: 150, data: { name: 'LWW_A' } };
    const concurrentB = { id: '2', region: 'eu-west', vectorClock: { 'eu-west': 2 }, timestamp: 180, data: { name: 'LWW_B' } };
    assert.strictEqual(resolver.resolveConflict(concurrentA, concurrentB).data.name, 'LWW_B');
  });
});
