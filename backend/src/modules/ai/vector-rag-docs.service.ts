import { Injectable, Logger } from '@nestjs/common';
import { VectorDocChunk } from '../../../src/types/ai';

@Injectable()
export class VectorRagDocsService {
  private readonly logger = new Logger(VectorRagDocsService.name);
  private documents: VectorDocChunk[] = [];

  constructor() {
    this.indexDocument({ docId: 'doc-std-vec', library: 'rust-std', symbol: 'Vec::with_capacity', content: 'Constructs a new, empty Vec<T> with the specified capacity.', score: 0.95 });
    this.indexDocument({ docId: 'doc-py-heapq', library: 'python-heapq', symbol: 'heapq.heappop', content: 'Pop and return the smallest item from the heap.', score: 0.92 });
  }

  public indexDocument(doc: VectorDocChunk): void {
    this.documents.push(doc);
  }

  public searchDocs(query: string, limit = 5): VectorDocChunk[] {
    const q = query.toLowerCase();
    return this.documents
      .filter(d => d.symbol.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.library.toLowerCase().includes(q))
      .slice(0, limit);
  }

  public getIndexSize(): number {
    return this.documents.length;
  }
}
