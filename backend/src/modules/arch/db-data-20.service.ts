/**
 * Architecture Service: Multi-Region Active-Active Conflict Resolution
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-20]
 */

export interface VersionRecord {
  id: string;
  region: string;
  vectorClock: Record<string, number>;
  timestamp: number;
  data: Record<string, unknown>;
}

export class MultiRegionConflictResolverService {
  public resolveConflict(recordA: VersionRecord, recordB: VersionRecord): VersionRecord {
    // Check vector clock dominance
    const aDominates = this.dominates(recordA.vectorClock, recordB.vectorClock);
    const bDominates = this.dominates(recordB.vectorClock, recordA.vectorClock);

    if (aDominates && !bDominates) return recordA;
    if (bDominates && !aDominates) return recordB;

    // Concurrent conflict: Fallback to Last-Write-Wins (LWW) with timestamp
    if (recordA.timestamp > recordB.timestamp) return recordA;
    if (recordB.timestamp > recordA.timestamp) return recordB;

    // Tie-breaker: Deterministic region lexical ordering
    return recordA.region.localeCompare(recordB.region) < 0 ? recordA : recordB;
  }

  private dominates(vcA: Record<string, number>, vcB: Record<string, number>): boolean {
    let strictlyGreater = false;
    for (const region of Object.keys(vcB)) {
      const valA = vcA[region] || 0;
      const valB = vcB[region];
      if (valA < valB) return false;
      if (valA > valB) strictlyGreater = true;
    }
    return strictlyGreater;
  }
}
