import test from 'node:test';
import assert from 'node:assert/strict';

class ServiceDependencyTopologyBuilder {
  buildGraph(spans) {
    const nodes = new Set();
    const edgeMap = new Map();

    for (const span of spans) {
      nodes.add(span.parentService);
      nodes.add(span.childService);

      const edgeKey = `${span.parentService}->${span.childService}`;
      edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
    }

    const edges = Array.from(edgeMap.entries()).map(([k, count]) => {
      const [from, to] = k.split('->');
      return { from, to, callCount: count };
    });

    const hasCircularDependency = edges.some(e1 =>
      edges.some(e2 => e1.from === e2.to && e1.to === e2.from)
    );

    return {
      nodes: Array.from(nodes),
      edges,
      hasCircularDependency
    };
  }
}

test('ServiceDependencyTopologyBuilder - constructs DAG topology and detects circular service calls', () => {
  const builder = new ServiceDependencyTopologyBuilder();
  const spans = [
    { parentService: 'gateway', childService: 'auth', latencyMs: 12, hasError: false },
    { parentService: 'gateway', childService: 'compiler', latencyMs: 45, hasError: false },
    { parentService: 'compiler', childService: 'sandbox', latencyMs: 30, hasError: false }
  ];

  const graph = builder.buildGraph(spans);
  assert.strictEqual(graph.nodes.length, 4);
  assert.strictEqual(graph.hasCircularDependency, false);

  spans.push({ parentService: 'sandbox', childService: 'compiler', latencyMs: 5, hasError: false });
  const cyclic = builder.buildGraph(spans);
  assert.strictEqual(cyclic.hasCircularDependency, true);
});
