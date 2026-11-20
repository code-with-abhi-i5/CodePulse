import { Test, TestingModule } from '@nestjs/testing';
import { CrdtSyncService, CrdtOperation } from './crdt-sync.service';

describe('CrdtSyncService', () => {
  let service: CrdtSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrdtSyncService],
    }).compile();

    service = module.get<CrdtSyncService>(CrdtSyncService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Commutative, Associative, and Idempotent convergence', () => {
    it('should converge to identical text regardless of message arrival order (Commutative)', () => {
      const doc1Id = 'doc_order_1';
      const doc2Id = 'doc_order_2';

      const opA: CrdtOperation = {
        id: 'client1:1',
        clientId: 1,
        clock: 1,
        type: 'insert',
        position: 0,
        char: 'H',
      };
      const opB: CrdtOperation = {
        id: 'client2:1',
        clientId: 2,
        clock: 1,
        type: 'insert',
        position: 1,
        char: 'i',
      };

      // Doc 1 receives A then B
      service.applyUpdate(doc1Id, opA);
      service.applyUpdate(doc1Id, opB);

      // Doc 2 receives B then A
      service.applyUpdate(doc2Id, opB);
      service.applyUpdate(doc2Id, opA);

      const state1 = service.getOrCreateDocument(doc1Id);
      const state2 = service.getOrCreateDocument(doc2Id);

      expect(state1.content).toBe(state2.content);
      expect(state1.content).toBe('Hi');
    });

    it('should be idempotent and ignore duplicate updates', () => {
      const docId = 'doc_idempotency';
      const op: CrdtOperation = {
        id: 'client1:1',
        clientId: 1,
        clock: 1,
        type: 'insert',
        position: 0,
        char: 'A',
      };

      const first = service.applyUpdate(docId, op);
      expect(first.applied).toBe(true);

      const duplicate = service.applyUpdate(docId, op);
      expect(duplicate.applied).toBe(false);

      const doc = service.getOrCreateDocument(docId);
      expect(doc.content).toBe('A');
      expect(doc.operations.length).toBe(1);
    });

    it('should compute missed deltas for offline reconnect catch-up', () => {
      const docId = 'doc_offline_catchup';
      const op1: CrdtOperation = { id: 'c1:1', clientId: 1, clock: 1, type: 'insert', position: 0, char: 'A' };
      const op2: CrdtOperation = { id: 'c1:2', clientId: 1, clock: 2, type: 'insert', position: 1, char: 'B' };
      const op3: CrdtOperation = { id: 'c2:1', clientId: 2, clock: 1, type: 'insert', position: 2, char: 'C' };

      service.applyUpdate(docId, op1);
      service.applyUpdate(docId, op2);
      service.applyUpdate(docId, op3);

      // Client had disconnected at c1:1 and c2:0
      const missing = service.getMissingDeltas(docId, { 1: 1, 2: 0 });
      expect(missing.length).toBe(2);
      expect(missing.map((m) => m.id)).toEqual(['c1:2', 'c2:1']);
    });

    it('should keep binary CRDT update payload under 80 bytes per keystroke', () => {
      const singleKeystroke: CrdtOperation = {
        id: 'c1:42',
        clientId: 1,
        clock: 42,
        type: 'insert',
        position: 15,
        char: 'x',
      };

      const compressed = service.compressUpdateBlob([singleKeystroke]);
      expect(compressed.length).toBeLessThan(80);

      const decompressed = service.decompressUpdateBlob(compressed);
      expect(decompressed).toEqual([singleKeystroke]);
    });
  });

  describe('Multi-cursor Awareness Protocol', () => {
    it('should track user presence and cursor coordinates', () => {
      const docId = 'doc_awareness';
      const peers = service.updateAwareness(docId, {
        clientId: 101,
        user: { id: 'u1', name: 'Alice', color: '#10b981' },
        cursor: { line: 12, column: 5 },
        lastSeenMs: Date.now(),
      });

      expect(peers.length).toBe(1);
      expect(peers[0].user.name).toBe('Alice');
      expect(peers[0].cursor?.line).toBe(12);

      service.removeAwareness(docId, 101);
      const after = service.updateAwareness(docId, {
        clientId: 102,
        user: { id: 'u2', name: 'Bob', color: '#3b82f6' },
        cursor: { line: 1, column: 1 },
        lastSeenMs: Date.now(),
      });
      expect(after.length).toBe(1);
      expect(after[0].user.name).toBe('Bob');
    });
  });
});

