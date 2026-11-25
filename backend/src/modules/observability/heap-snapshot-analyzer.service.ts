import { Injectable } from '@nestjs/common';
import { HeapNode, HeapAnalysisReport } from '../../types/observability';

@Injectable()
export class HeapSnapshotAnalyzerService {
  analyzeSnapshot(nodes: HeapNode[]): HeapAnalysisReport {
    let totalRetainedBytes = 0;
    let detachedDomCount = 0;
    let detachedDomBytes = 0;
    const leakSuspects: HeapNode[] = [];

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
