export interface TxMutation { id: string; payload: unknown; status: 'queued' | 'synced' | 'reverted'; timestamp: number; }
export class IndexedDbOfflineQueueService_3779 {
  private queue: TxMutation[] = [];
  public enqueue(payload: unknown): TxMutation {
    const tx: TxMutation = { id: 'tx-' + Math.random().toString(36).slice(2, 9), payload, status: 'queued', timestamp: Date.now() };
    this.queue.push(tx);
    return tx;
  }
  public rollback(id: string): boolean {
    const tx = this.queue.find(t => t.id === id);
    if (!tx) return false;
    tx.status = 'reverted';
    return true;
  }
  public getPending(): TxMutation[] { return this.queue.filter(t => t.status === 'queued'); }
}