/**
 * Architecture Service: Spatial Query Optimization for Matchmaking
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-28]
 */

export class SpatialMatchmakingQueryService {
  public generateNearbyPlayersDdl(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 500,
    limit: number = 10
  ): string {
    const meters = maxDistanceKm * 1000;
    return `SELECT player_id, location, ST_Distance(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) as distance_meters
FROM player_presence
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${meters})
ORDER BY location <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
LIMIT ${limit};`;
  }

  public haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}
