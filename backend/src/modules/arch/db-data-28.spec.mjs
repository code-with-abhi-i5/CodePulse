import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SpatialMatchmakingQueryService } from './db-data-28.service.ts';

describe('SpatialMatchmakingQueryService (DB-DATA-28)', () => {
  it('generates PostGIS indexed spatial query and computes haversine distance', () => {
    const service = new SpatialMatchmakingQueryService();
    const query = service.generateNearbyPlayersDdl(37.7749, -122.4194, 250, 5);

    assert.ok(query.includes('ST_DWithin'));
    assert.ok(query.includes('ST_MakePoint(-122.4194, 37.7749)'));

    const dist = service.haversineDistanceKm(37.7749, -122.4194, 34.0522, -118.2437);
    assert.ok(dist > 500 && dist < 600); // SF to LA is approx 559 km
  });
});
