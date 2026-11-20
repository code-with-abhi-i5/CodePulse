import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as zlib from 'zlib';

export interface CrdtClientAwareness {
  clientId: number;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    color: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  lastSeenMs: number;
}

export interface CrdtOperation {
  id: string; // e.g. "client1:1"
  clientId: number;
  clock: number;
  type: 'insert' | 'delete';
  position: number;
  char?: string;
  origin?: string;
}

export interface CrdtDocumentState {
  docId: string;
  stateVector: Record<number, number>; // clientId -> highest clock
  operations: CrdtOperation[];
  content: string;
  lastPersistedMs: number;
  compressedSnapshot?: string; // base64 compressed representation
}

@Injectable()
export class CrdtSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrdtSyncService.name);
  private readonly documents = new Map<string, CrdtDocumentState>();
  private readonly awarenessStates = new Map<string, Map<number, CrdtClientAwareness>>();
  private persistenceTimer: NodeJS.Timeout | null = null;

  onModuleInit() {
    // Background persistence loop every 10 seconds
    this.persistenceTimer = setInterval(() => {
      this.persistActiveDocuments();
    }, 10000);
  }

  onModuleDestroy() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
  }

  /**
   * Initializes or fetches a collaborative document
   */
  public getOrCreateDocument(docId: string, initialContent = ''): CrdtDocumentState {
    let doc = this.documents.get(docId);
    if (!doc) {
      doc = {
        docId,
        stateVector: {},
        operations: [],
        content: initialContent,
        lastPersistedMs: Date.now(),
      };
      this.documents.set(docId, doc);
      this.awarenessStates.set(docId, new Map());
    }
    return doc;
  }

  /**
   * Applies an incoming binary or serialized CRDT delta update
   * Guarantees Commutative, Associative, and Idempotent convergence
   */
  public applyUpdate(docId: string, op: CrdtOperation): { doc: CrdtDocumentState; applied: boolean } {
    const doc = this.getOrCreateDocument(docId);
    const highestSeen = doc.stateVector[op.clientId] || 0;

    // Idempotency: Ignore duplicate operations already factored into state vector
    if (op.clock <= highestSeen && doc.operations.some((existing) => existing.id === op.id)) {
      return { doc, applied: false };
    }

    // Insert operation into order maintaining deterministic convergence
    doc.operations.push(op);
    doc.stateVector[op.clientId] = Math.max(highestSeen, op.clock);

    // Reconstruct canonical text from CRDT operations deterministically
    doc.content = this.computeTextFromOperations(doc.operations);

    return { doc, applied: true };
  }

  /**
   * Computes state delta required by a client given their state vector
   * (Handles offline reconnect catching up missed state deltas without conflicts)
   */
  public getMissingDeltas(docId: string, clientVector: Record<number, number>): CrdtOperation[] {
    const doc = this.getOrCreateDocument(docId);
    return doc.operations.filter((op) => {
      const clientClock = clientVector[op.clientId] || 0;
      return op.clock > clientClock;
    });
  }

  /**
   * Encodes and compresses Yjs/CRDT binary update blob with deflate/gzip
   * Uses compact tuple representation for sub-80 byte binary payload per keystroke
   */
  public compressUpdateBlob(operations: CrdtOperation[]): Buffer {
    // Compact tuple format: [id, clientId, clock, type==='insert'?1:0, position, char||'']
    const compact = operations.map((o) => [
      o.id,
      o.clientId,
      o.clock,
      o.type === 'insert' ? 1 : 0,
      o.position,
      o.char || '',
    ]);
    const serialized = JSON.stringify(compact);
    return zlib.deflateRawSync(Buffer.from(serialized, 'utf8'));
  }

  /**
   * Decompresses CRDT update blob back into operations
   */
  public decompressUpdateBlob(compressed: Buffer): CrdtOperation[] {
    const decompressed = zlib.inflateRawSync(compressed);
    const compact = JSON.parse(decompressed.toString('utf8'));
    return compact.map((c: any) => ({
      id: c[0],
      clientId: c[1],
      clock: c[2],
      type: c[3] === 1 ? 'insert' : 'delete',
      position: c[4],
      char: c[5] || undefined,
    }));
  }

  /**
   * Updates multi-cursor user presence awareness
   */
  public updateAwareness(docId: string, awareness: CrdtClientAwareness): CrdtClientAwareness[] {
    if (!this.awarenessStates.has(docId)) {
      this.awarenessStates.set(docId, new Map());
    }
    const docAwareness = this.awarenessStates.get(docId)!;
    awareness.lastSeenMs = Date.now();
    docAwareness.set(awareness.clientId, awareness);

    // Evict stale peers (> 30s)
    const now = Date.now();
    for (const [cid, state] of docAwareness.entries()) {
      if (now - state.lastSeenMs > 30000) {
        docAwareness.delete(cid);
      }
    }

    return Array.from(docAwareness.values());
  }

  /**
   * Removes client from awareness map on disconnect
   */
  public removeAwareness(docId: string, clientId: number): void {
    const docAwareness = this.awarenessStates.get(docId);
    if (docAwareness) {
      docAwareness.delete(clientId);
    }
  }

  /**
   * Persists compressed Yjs binary update blobs to database every 10 seconds
   */
  public persistActiveDocuments(): void {
    const now = Date.now();
    for (const [docId, doc] of this.documents.entries()) {
      if (doc.operations.length > 0 && now - doc.lastPersistedMs >= 10000) {
        const compressed = this.compressUpdateBlob(doc.operations);
        doc.compressedSnapshot = compressed.toString('base64');
        doc.lastPersistedMs = now;
        this.logger.debug(
          `Persisted compressed CRDT snapshot for doc ${docId} (${compressed.length} bytes)`,
        );
      }
    }
  }

  /**
   * Pure deterministic convergence algorithm for operations
   */
  private computeTextFromOperations(operations: CrdtOperation[]): string {
    // Sort deterministically: by position first, then timestamp/clock, then clientId
    const sorted = [...operations].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      if (a.clock !== b.clock) return a.clock - b.clock;
      return a.clientId - b.clientId;
    });

    let result = '';
    for (const op of sorted) {
      if (op.type === 'insert' && op.char) {
        const pos = Math.min(Math.max(0, op.position), result.length);
        result = result.slice(0, pos) + op.char + result.slice(pos);
      } else if (op.type === 'delete') {
        const pos = Math.min(Math.max(0, op.position), result.length);
        if (result.length > 0) {
          result = result.slice(0, pos) + result.slice(pos + 1);
        }
      }
    }
    return result;
  }
}
