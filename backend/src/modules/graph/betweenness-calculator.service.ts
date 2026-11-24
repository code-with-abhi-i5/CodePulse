import { Injectable, Logger } from '@nestjs/common';

export interface GraphEdge {
  fromNode: string;
  toNode: string;
  weight?: number;
}

@Injectable()
export class BetweennessCalculatorService {
  private readonly logger = new Logger(BetweennessCalculatorService.name);

  /**
   * Computes Betweenness Centrality using Ulrik Brandes' algorithm in O(V * E) time.
   * Returns a map of node -> normalized betweenness score [0..1].
   */
  public computeBetweennessCentrality(
    nodes: string[],
    edges: GraphEdge[],
  ): Map<string, number> {
    const betweenness = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      betweenness.set(node, 0);
      adjacency.set(node, []);
    }

    for (const edge of edges) {
      if (adjacency.has(edge.fromNode)) {
        adjacency.get(edge.fromNode)!.push(edge.toNode);
      }
      // Undirected graph assumption for review collaboration
      if (adjacency.has(edge.toNode)) {
        adjacency.get(edge.toNode)!.push(edge.fromNode);
      }
    }

    const n = nodes.length;

    // Brandes' Algorithm
    for (const s of nodes) {
      const stack: string[] = [];
      const predecessors = new Map<string, string[]>();
      const sigma = new Map<string, number>(); // Number of shortest paths
      const distance = new Map<string, number>();
      const delta = new Map<string, number>(); // Dependency ratio

      for (const w of nodes) {
        predecessors.set(w, []);
        sigma.set(w, 0);
        distance.set(w, -1);
        delta.set(w, 0);
      }

      sigma.set(s, 1);
      distance.set(s, 0);

      const queue: string[] = [s];

      // BFS shortest-path exploration
      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);

        const neighbors = adjacency.get(v) || [];
        for (const w of neighbors) {
          // w found for the first time?
          if (distance.get(w)! < 0) {
            queue.push(w);
            distance.set(w, distance.get(v)! + 1);
          }

          // Shortest path to w via v?
          if (distance.get(w) === distance.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        }
      }

      // Backpropagation of dependencies
      while (stack.length > 0) {
        const w = stack.pop()!;
        const preds = predecessors.get(w) || [];

        for (const v of preds) {
          const sigmaV = sigma.get(v) || 1;
          const sigmaW = sigma.get(w) || 1;
          const coeff = (sigmaV / sigmaW) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + coeff);
        }

        if (w !== s) {
          betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
        }
      }
    }

    // Undirected graph normalization factor: 2 / ((N - 1) * (N - 2))
    const scale = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1.0;
    for (const node of nodes) {
      const raw = betweenness.get(node) || 0;
      betweenness.set(node, Number((raw * scale).toFixed(4)));
    }

    return betweenness;
  }
}
