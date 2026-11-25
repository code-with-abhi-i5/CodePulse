import { Injectable } from '@nestjs/common';
import { TraceSpan, FlamegraphNode } from '../../types/observability';

@Injectable()
export class TraceFlamegraphVisualizerService {
  buildFlamegraph(spans: TraceSpan[]): FlamegraphNode | null {
    if (spans.length === 0) return null;

    const rootSpan = spans.find(s => !s.parentSpanId) || spans[0];
    const childrenMap = new Map<string, TraceSpan[]>();

    for (const span of spans) {
      if (span.parentSpanId) {
        const list = childrenMap.get(span.parentSpanId) || [];
        list.push(span);
        childrenMap.set(span.parentSpanId, list);
      }
    }

    function buildNode(span: TraceSpan, rootDuration: number): FlamegraphNode {
      const childSpans = childrenMap.get(span.spanId) || [];
      const children = childSpans.map(c => buildNode(c, rootDuration));
      const childTotalDuration = children.reduce((acc, c) => acc + c.value, 0);
      const selfTimeUs = Math.max(0, span.durationUs - childTotalDuration);
      const percent = parseFloat(((span.durationUs / rootDuration) * 100).toFixed(2));

      return {
        name: span.name,
        value: span.durationUs,
        selfTimeUs,
        percentOfTotal: percent,
        children
      };
    }

    return buildNode(rootSpan, rootSpan.durationUs);
  }
}
