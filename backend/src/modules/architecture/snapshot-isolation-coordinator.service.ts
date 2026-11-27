export interface SnapshotTx {
  txId: string;
  startTimestamp: number;
  writes: Map<string, any>;
}

export class SnapshotIsolationCoordinator {
  private globalClock = 1;
  private committedVersions = new Map<string, { value: any; commitTs: number }[]>();
  private activeTx = new Map<string, SnapshotTx>();

  public beginTransaction(txId: string): number {
    const startTs = this.globalClock++;
    this.activeTx.set(txId, {
      txId,
      startTimestamp: startTs,
      writes: new Map()
    });
    return startTs;
  }

  public read(txId: string, rowKey: string): any {
    const tx = this.activeTx.get(txId);
    if (!tx) throw new Error(`Tx ${txId} not found`);

    // 1. Read own writes if exists
    if (tx.writes.has(rowKey)) {
      return tx.writes.get(rowKey);
    }

    // 2. Read latest committed version committed before or at tx startTimestamp
    const versions = this.committedVersions.get(rowKey) || [];
    for (let i = versions.length - 1; i >= 0; i--) {
      if (versions[i].commitTs <= tx.startTimestamp) {
        return versions[i].value;
      }
    }

    return undefined;
  }

  public write(txId: string, rowKey: string, value: any): void {
    const tx = this.activeTx.get(txId);
    if (!tx) throw new Error(`Tx ${txId} not found`);
    tx.writes.set(rowKey, value);
  }

  public commit(txId: string): { success: boolean; conflictKey?: string } {
    const tx = this.activeTx.get(txId);
    if (!tx) throw new Error(`Tx ${txId} not found`);

    // First-committer-wins validation: check if any written row has been modified after startTimestamp
    for (const rowKey of tx.writes.keys()) {
      const versions = this.committedVersions.get(rowKey) || [];
      const hasConflict = versions.some(v => v.commitTs > tx.startTimestamp);
      if (hasConflict) {
        this.activeTx.delete(txId);
        return { success: false, conflictKey: rowKey };
      }
    }

    const commitTs = this.globalClock++;
    for (const [rowKey, val] of tx.writes.entries()) {
      let list = this.committedVersions.get(rowKey);
      if (!list) {
        list = [];
        this.committedVersions.set(rowKey, list);
      }
      list.push({ value: val, commitTs });
    }

    this.activeTx.delete(txId);
    return { success: true };
  }
}
