/**
 * Architecture Service: Monaco Multi-Cursor CRDT Sync Engine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-18]
 */

export interface TextOperation {
  type: 'INSERT' | 'DELETE';
  position: number;
  length: number;
  text?: string;
  clientId: string;
}

export class MonacoMultiCursorCrdtSyncService {
  public transformCursor(cursorPos: number, op: TextOperation, isOwnOperation: boolean): number {
    if (isOwnOperation) return cursorPos;

    if (op.type === 'INSERT') {
      if (op.position <= cursorPos) {
        return cursorPos + (op.text?.length || op.length);
      }
      return cursorPos;
    }

    if (op.type === 'DELETE') {
      if (op.position + op.length <= cursorPos) {
        return cursorPos - op.length;
      }
      if (op.position < cursorPos) {
        return op.position; // Cursor was inside deleted range
      }
      return cursorPos;
    }

    return cursorPos;
  }
}
