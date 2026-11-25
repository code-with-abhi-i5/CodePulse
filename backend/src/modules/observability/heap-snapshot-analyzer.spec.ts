import { HeapSnapshotAnalyzerService } from './heap-snapshot-analyzer.service';

describe('HeapSnapshotAnalyzerService', () => {
  let service: HeapSnapshotAnalyzerService;
  beforeEach(() => { service = new HeapSnapshotAnalyzerService(); });
  it('analyzes heap nodes', () => {
    const rep = service.analyzeSnapshot([]);
    expect(rep.totalNodes).toBe(0);
  });
});
