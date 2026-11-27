import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CrdtJsonDocumentMerger } from './crdt-json-document-merger.service.ts';

describe('CrdtJsonDocumentMerger [ARCH-CORE-002]', () => {
  const merger = new CrdtJsonDocumentMerger();

  test('resolves field-level concurrent modifications with deterministic LWW', () => {
    const docA = {
      title: { value: 'Original Title', timestamp: 100 },
      author: { value: 'Alice', timestamp: 150 }
    };
    const docB = {
      title: { value: 'Updated Title', timestamp: 200 }, // newer
      author: { value: 'Bob', timestamp: 120 }           // older
    };

    const merged = merger.mergeDocuments(docA, docB);
    assert.equal(merged.title.value, 'Updated Title');
    assert.equal(merged.author.value, 'Alice');
  });
});
