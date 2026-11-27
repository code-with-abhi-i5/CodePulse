export type LockMode = 'SHARED' | 'EXCLUSIVE';

export interface LockHolder {
  txId: string;
  timestamp: number;
  mode: LockMode;
}

export interface LockRequestResult {
  granted: boolean;
  action: 'ACQUIRED' | 'WAIT' | 'DIE';
  reason?: string;
}

export class WaitDieResourceArbiterService {
  private transactions = new Map<string, number>(); // txId -> timestamp
  private locks = new Map<string, LockHolder[]>(); // resourceId -> LockHolder[]
  private waitQueues = new Map<string, { txId: string; timestamp: number; mode: LockMode }[]>();

  public registerTransaction(txId: string, timestamp = Date.now()): number {
    if (!this.transactions.has(txId)) {
      this.transactions.set(txId, timestamp);
    }
    return this.transactions.get(txId)!;
  }

  public getTransactionTimestamp(txId: string): number {
    return this.transactions.get(txId) ?? this.registerTransaction(txId);
  }

  public requestLock(txId: string, resourceId: string, mode: LockMode = 'EXCLUSIVE'): LockRequestResult {
    const txTs = this.getTransactionTimestamp(txId);
    const holders = this.locks.get(resourceId) || [];

    // If resource is not locked at all
    if (holders.length === 0) {
      this.locks.set(resourceId, [{ txId, timestamp: txTs, mode }]);
      return { granted: true, action: 'ACQUIRED' };
    }

    // Check if current tx already holds the required lock
    const selfHolder = holders.find(h => h.txId === txId);
    if (selfHolder) {
      if (selfHolder.mode === mode || selfHolder.mode === 'EXCLUSIVE') {
        return { granted: true, action: 'ACQUIRED' };
      }
      // Upgrade shared to exclusive
      if (holders.length === 1) {
        selfHolder.mode = 'EXCLUSIVE';
        return { granted: true, action: 'ACQUIRED' };
      }
    }

    // If both requesting shared and only shared locks exist
    if (mode === 'SHARED' && holders.every(h => h.mode === 'SHARED')) {
      holders.push({ txId, timestamp: txTs, mode: 'SHARED' });
      return { granted: true, action: 'ACQUIRED' };
    }

    // Conflict exists: evaluate Wait-Die Scheme
    // In Wait-Die:
    // If requesting Tx is OLDER than any conflicting holder (txTs < holder.timestamp), Tx WAITS.
    // If requesting Tx is YOUNGER than conflicting holder (txTs > holder.timestamp), Tx DIES.
    const isOlderThanAllConflicts = holders.every(h => txTs <= h.timestamp);

    if (isOlderThanAllConflicts) {
      // Allowed to wait
      let queue = this.waitQueues.get(resourceId);
      if (!queue) {
        queue = [];
        this.waitQueues.set(resourceId, queue);
      }
      if (!queue.find(q => q.txId === txId)) {
        queue.push({ txId, timestamp: txTs, mode });
      }
      return { granted: false, action: 'WAIT', reason: 'Older transaction allowed to wait' };
    } else {
      // Younger transaction dies to prevent deadlock cycle
      return { granted: false, action: 'DIE', reason: 'Younger transaction aborted (Wait-Die deadlock prevention)' };
    }
  }

  public releaseLock(txId: string, resourceId: string): string[] {
    const holders = this.locks.get(resourceId);
    if (!holders) return [];

    const remaining = holders.filter(h => h.txId !== txId);
    if (remaining.length === 0) {
      this.locks.delete(resourceId);
    } else {
      this.locks.set(resourceId, remaining);
    }

    // Process wait queue
    const unblocked: string[] = [];
    const queue = this.waitQueues.get(resourceId);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      this.locks.set(resourceId, [{ txId: next.txId, timestamp: next.timestamp, mode: next.mode }]);
      unblocked.push(next.txId);
    }

    return unblocked;
  }

  public abortTransaction(txId: string): void {
    this.transactions.delete(txId);
    for (const [resId, holders] of this.locks.entries()) {
      const filtered = holders.filter(h => h.txId !== txId);
      if (filtered.length === 0) {
        this.locks.delete(resId);
      } else {
        this.locks.set(resId, filtered);
      }
    }
    for (const [resId, queue] of this.waitQueues.entries()) {
      this.waitQueues.set(resId, queue.filter(q => q.txId !== txId));
    }
  }

  public getActiveHolders(resourceId: string): LockHolder[] {
    return this.locks.get(resourceId) || [];
  }
}
