import { WalLogEvent } from '../../types/db';

export class WalStreamingFollowerService {
  private lastCommittedLsn: string = '0/0';

  public processWalChange(rawChange: {
    lsn: string;
    xid: number;
    table: string;
    kind: 'insert' | 'update' | 'delete';
    rowId: string;
    data: Record<string, unknown>;
  }): WalLogEvent {
    this.lastCommittedLsn = rawChange.lsn;
    return {
      lsn: rawChange.lsn,
      transactionId: rawChange.xid,
      table: rawChange.table,
      operation: rawChange.kind.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
      documentId: rawChange.rowId,
      payload: rawChange.data
    };
  }

  public toSearchIndexAction(event: WalLogEvent, indexName: string): { action: string; metadata: Record<string, unknown>; source?: Record<string, unknown> } {
    if (event.operation === 'DELETE') {
      return {
        action: 'delete',
        metadata: { _index: indexName, _id: event.documentId }
      };
    }

    return {
      action: 'index',
      metadata: { _index: indexName, _id: event.documentId },
      source: event.payload
    };
  }

  public getLastLsn(): string {
    return this.lastCommittedLsn;
  }
}
