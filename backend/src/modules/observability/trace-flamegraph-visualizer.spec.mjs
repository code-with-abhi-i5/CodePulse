import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TraceFlamegraphVisualizerService {
  buildFlamegraph(spans) {
    if (spans.length === 0) return null;
    const rootSpan = spans.find(s => !s.parentSpanId) || spans[0];
    const childrenMap = new Map();
    for (const span of spans) {
      if (span.parentSpanId) {
        const list = childrenMap.get(span.parentSpanId) || [];
        list.push(span);
        childrenMap.set(span.parentSpanId, list);
      }
    }
    function buildNode(span, rootDuration) {
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

describe('TraceFlamegraphVisualizerService', () => {
  it('constructs hierarchical flamegraph node tree with correct self-time calculations', () => {
    const visualizer = new TraceFlamegraphVisualizerService();
    const flame = visualizer.buildFlamegraph([
      { spanId: 'root', name: 'HTTP POST /api/submit', startTimeUs: 0, durationUs: 1000 },
      { spanId: 'c1', parentSpanId: 'root', name: 'AuthInterceptor', startTimeUs: 100, durationUs: 200 },
      { spanId: 'c2', parentSpanId: 'root', name: 'SandboxExecution', startTimeUs: 350, durationUs: 600 }
    ]);

    assert.ok(flame !== null);
    assert.strictEqual(flame.name, 'HTTP POST /api/submit');
    assert.strictEqual(flame.value, 1000);
    assert.strictEqual(flame.selfTimeUs, 200);
    assert.strictEqual(flame.children.length, 2);
    assert.strictEqual(flame.children[0].name, 'AuthInterceptor');
    assert.strictEqual(flame.children[1].name, 'SandboxExecution');
  });
});
