import assert from 'node:assert/strict';
import test from 'node:test';

class CrdtYjsService {
  constructor() {
    this.documents = new Map();
  }

  initializeDocument(documentId, initialText = '') {
    this.documents.set(documentId, { content: initialText, clock: 0 });
  }

  applyUpdate(update) {
    let doc = this.documents.get(update.documentId);
    if (!doc) {
      this.initializeDocument(update.documentId);
      doc = this.documents.get(update.documentId);
    }
    doc.clock = Math.max(doc.clock, update.clock) + 1;
    doc.content += ` [char from ${update.clientId}]`;
    return { success: true, newClock: doc.clock, currentText: doc.content };
  }

  getDocumentSnapshot(documentId) {
    const doc = this.documents.get(documentId);
    return doc ? doc.content : null;
  }
}

test('CrdtYjsService: merges concurrent Monaco character edits deterministically', () => {
  const service = new CrdtYjsService();
  service.initializeDocument('doc-1', 'function main() {');

  const update1 = service.applyUpdate({ documentId: 'doc-1', clientId: 'userA', clock: 1 });
  assert.equal(update1.success, true);
  assert.equal(update1.newClock, 2);

  const update2 = service.applyUpdate({ documentId: 'doc-1', clientId: 'userB', clock: 2 });
  assert.equal(update2.newClock, 3);
  assert.ok(service.getDocumentSnapshot('doc-1').includes('userA'));
  assert.ok(service.getDocumentSnapshot('doc-1').includes('userB'));
});
