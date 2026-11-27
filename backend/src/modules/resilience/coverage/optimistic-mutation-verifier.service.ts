export interface MutationSnapshot<T> {
  id: string;
  previousValue: T;
  optimisticValue: T;
  status: 'PENDING' | 'COMMITTED' | 'ROLLEDBACK';
  timestamp: number;
}

export class OptimisticMutationRollbackVerifier<T = any> {
  private snapshots = new Map<string, MutationSnapshot<T>>();

  public applyOptimistic(id: string, previousValue: T, optimisticValue: T): MutationSnapshot<T> {
    const snapshot: MutationSnapshot<T> = {
      id,
      previousValue,
      optimisticValue,
      status: 'PENDING',
      timestamp: Date.now()
    };
    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  public commit(id: string): boolean {
    const s = this.snapshots.get(id);
    if (!s || s.status !== 'PENDING') return false;
    s.status = 'COMMITTED';
    return true;
  }

  public rollback(id: string): { restoredValue: T | undefined; success: boolean } {
    const s = this.snapshots.get(id);
    if (!s || s.status !== 'PENDING') return { restoredValue: undefined, success: false };
    s.status = 'ROLLEDBACK';
    return { restoredValue: s.previousValue, success: true };
  }

  public getSnapshot(id: string): MutationSnapshot<T> | undefined {
    return this.snapshots.get(id);
  }
}
