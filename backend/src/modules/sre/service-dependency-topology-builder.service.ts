import { SpanDependency, TopologyGraph } from '../../types/sre';

export class ServiceDependencyTopologyBuilder {
  buildGraph(spans: SpanDependency[]): TopologyGraph {
    const nodes = new Set<string>();
    const edgeMap = new Map<string, number>();

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
