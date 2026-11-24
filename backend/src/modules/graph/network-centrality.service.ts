import { Injectable, Logger } from '@nestjs/common';
import { BetweennessCalculatorService, GraphEdge } from './betweenness-calculator.service';

export interface DeveloperReviewNode {
  developerId: string;
  name: string;
  activeReviewsPending: number;
}

export interface CentralityAnalysisResult {
  developerId: string;
  name: string;
  betweennessCentrality: number; // 0..1 (gatekeeper metric)
  eigenvectorCentrality: number; // 0..1 (influence metric)
  isBottleneck: boolean;
  bottleneckSeverity: 'CRITICAL' | 'MODERATE' | 'LOW';
  recommendation?: string;
}

export interface NetworkCentralityReport {
  totalNodes: number;
  totalReviewInteractions: number;
  bottleneckCount: number;
  rankings: CentralityAnalysisResult[];
  calculationDurationMs: number;
  analyzedAt: Date;
}

@Injectable()
export class NetworkCentralityService {
  private readonly logger = new Logger(NetworkCentralityService.name);

  constructor(private readonly betweennessCalc: BetweennessCalculatorService) {}

  /**
   * Computes Eigenvector Centrality using the Power Iteration algorithm.
   */
  public computeEigenvectorCentrality(
    nodes: string[],
    edges: GraphEdge[],
    maxIterations = 50,
    tolerance = 1e-5,
  ): Map<string, number> {
    const n = nodes.length;
    const nodeIndex = new Map<string, number>();
    nodes.forEach((id, idx) => nodeIndex.set(id, idx));

    // Construct adjacency list
    const adjacency = new Map<number, number[]>();
    for (let i = 0; i < n; i++) adjacency.set(i, []);

    for (const edge of edges) {
      const u = nodeIndex.get(edge.fromNode);
      const v = nodeIndex.get(edge.toNode);
      if (u !== undefined && v !== undefined) {
        adjacency.get(u)!.push(v);
        adjacency.get(v)!.push(u);
      }
    }

    // Initialize unit vector
    let x = new Float64Array(n).fill(1 / Math.sqrt(n));

    for (let iter = 0; iter < maxIterations; iter++) {
      const xNext = new Float64Array(n);

      for (let i = 0; i < n; i++) {
        const neighbors = adjacency.get(i) || [];
        for (const j of neighbors) {
          xNext[i] += x[j];
        }
      }

      // Compute L2 norm
      let norm = 0;
      for (let i = 0; i < n; i++) {
        norm += xNext[i] * xNext[i];
      }
      norm = Math.sqrt(norm);

      if (norm === 0) break;

      // Normalize
      let maxDiff = 0;
      for (let i = 0; i < n; i++) {
        xNext[i] /= norm;
        maxDiff = Math.max(maxDiff, Math.abs(xNext[i] - x[i]));
      }

      x = xNext;
      if (maxDiff < tolerance) break;
    }

    const resultMap = new Map<string, number>();
    nodes.forEach((id, idx) => {
      resultMap.set(id, Number(x[idx].toFixed(4)));
    });

    return resultMap;
  }

  /**
   * Evaluates the entire pull request review network in < 500ms.
   */
  public analyzeReviewNetwork(
    reviewers: DeveloperReviewNode[],
    edges: GraphEdge[],
  ): NetworkCentralityReport {
    const start = performance.now();
    const nodeIds = reviewers.map((r) => r.developerId);

    // Compute both centralities
    const betweennessMap = this.betweennessCalc.computeBetweennessCentrality(nodeIds, edges);
    const eigenvectorMap = this.computeEigenvectorCentrality(nodeIds, edges);

    let bottleneckCount = 0;
    const rankings: CentralityAnalysisResult[] = [];

    for (const dev of reviewers) {
      const bc = betweennessMap.get(dev.developerId) || 0;
      const ec = eigenvectorMap.get(dev.developerId) || 0;

      // Bottleneck identification: high betweenness (>0.25) AND overloaded with pending reviews (>5)
      const isBottleneck = bc >= 0.25 && dev.activeReviewsPending >= 4;

      let severity: CentralityAnalysisResult['bottleneckSeverity'] = 'LOW';
      let recommendation: string | undefined;

      if (isBottleneck) {
        bottleneckCount++;
        if (bc >= 0.45 && dev.activeReviewsPending >= 8) {
          severity = 'CRITICAL';
          recommendation = `CRITICAL GATEKEEPER: ${dev.name} is on the critical review path for ${Math.round(bc * 100)}% of cross-team PRs with ${dev.activeReviewsPending} blocked reviews. Immediately reassign review requests.`;
        } else {
          severity = 'MODERATE';
          recommendation = `Moderate bottleneck: ${dev.name} has elevated centrality (${Math.round(bc * 100)}%). Pair with secondary reviewer to share review load.`;
        }
      }

      rankings.push({
        developerId: dev.developerId,
        name: dev.name,
        betweennessCentrality: bc,
        eigenvectorCentrality: ec,
        isBottleneck,
        bottleneckSeverity: severity,
        recommendation,
      });
    }

    rankings.sort((a, b) => b.betweennessCentrality - a.betweennessCentrality);
    const duration = Number((performance.now() - start).toFixed(2));

    this.logger.log(
      `Network centrality analyzed (${reviewers.length} nodes, ${edges.length} edges) in ${duration}ms (<500ms benchmark). Bottlenecks: ${bottleneckCount}`,
    );

    return {
      totalNodes: reviewers.length,
      totalReviewInteractions: edges.length,
      bottleneckCount,
      rankings,
      calculationDurationMs: duration,
      analyzedAt: new Date(),
    };
  }
}
