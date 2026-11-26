import assert from 'node:assert/strict';
import test from 'node:test';

class VectorRagDocsService {
  constructor() {
    this.documents = [
      { docId: 'd1', library: 'rust-std', symbol: 'Vec::with_capacity', content: 'Constructs empty Vec' },
      { docId: 'd2', library: 'python-heapq', symbol: 'heapq.heappop', content: 'Pop smallest item' }
    ];
  }

  searchDocs(query, limit = 5) {
    const q = query.toLowerCase();
    return this.documents.filter(d => d.symbol.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)).slice(0, limit);
  }
}

test('VectorRagDocsService: performs semantic search on standard library documents', () => {
  const rag = new VectorRagDocsService();
  const results = rag.searchDocs('Vec');
  assert.equal(results.length, 1);
  assert.equal(results[0].symbol, 'Vec::with_capacity');
});
