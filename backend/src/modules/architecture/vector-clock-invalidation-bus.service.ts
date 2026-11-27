export type VectorClock = Record<string, number>;

export class VectorClockCacheInvalidationBus {
  public compare(v1: VectorClock, v2: VectorClock): 'BEFORE' | 'AFTER' | 'CONCURRENT' | 'EQUAL' {
    const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
    let hasGreater = false;
    let hasLesser = false;

    for (const k of allKeys) {
      const c1 = v1[k] || 0;
      const c2 = v2[k] || 0;
      if (c1 > c2) hasGreater = true;
      if (c1 < c2) hasLesser = true;
    }

    if (!hasGreater && !hasLesser) return 'EQUAL';
    if (hasGreater && !hasLesser) return 'AFTER';
    if (!hasGreater && hasLesser) return 'BEFORE';
    return 'CONCURRENT';
  }

  public increment(clock: VectorClock, nodeId: string): VectorClock {
    return {
      ...clock,
      [nodeId]: (clock[nodeId] || 0) + 1
    };
  }

  public merge(v1: VectorClock, v2: VectorClock): VectorClock {
    const merged: VectorClock = {};
    const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
    for (const k of allKeys) {
      merged[k] = Math.max(v1[k] || 0, v2[k] || 0);
    }
    return merged;
  }
}
