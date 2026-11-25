import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class HeapSnapshotAnalyzerService {
  analyzeSnapshot(nodes) {
    let totalRetainedBytes = 0;
    let detachedDomCount = 0;
    let detachedDomBytes = 0;
    const leakSuspects = [];
    for (const node of nodes) {
      totalRetainedBytes += node.retainedSize;
      if (node.detachedDom) {
        detachedDomCount++;
        detachedDomBytes += node.retainedSize;
        leakSuspects.push(node);
      } else if (node.retainedSize > 10 * 1024 * 1024) {
        leakSuspects.push(node);
      }
    }
    leakSuspects.sort((a, b) => b.retainedSize - a.retainedSize);
    return {
      totalNodes: nodes.length,
      totalRetainedBytes,
      detachedDomNodesCount: detachedDomCount,
      detachedDomBytes,
      leakSuspects
    };
  }
}

describe('HeapSnapshotAnalyzerService', () => {
  it('flags detached DOM nodes and oversized retainers in heap snapshots', () => {
    const analyzer = new HeapSnapshotAnalyzerService();
    const report = analyzer.analyzeSnapshot([
      { id: 1, name: 'HTMLDivElement', type: 'dom', selfSize: 1024, retainedSize: 5242880, detachedDom: true },
      { id: 2, name: 'BufferArray', type: 'array', selfSize: 2048, retainedSize: 20971520, detachedDom: false },
      { id: 3, name: 'SmallObject', type: 'object', selfSize: 128, retainedSize: 256, detachedDom: false }
    ]);

    assert.strictEqual(report.totalNodes, 3);
    assert.strictEqual(report.detachedDomNodesCount, 1);
    assert.strictEqual(report.detachedDomBytes, 5242880);
    assert.strictEqual(report.leakSuspects.length, 2);
    assert.strictEqual(report.leakSuspects[0].name, 'BufferArray');
    assert.strictEqual(report.leakSuspects[1].name, 'HTMLDivElement');
  });
});
