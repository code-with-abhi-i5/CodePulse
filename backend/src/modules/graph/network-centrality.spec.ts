import { Test, TestingModule } from '@nestjs/testing';
import { BetweennessCalculatorService, GraphEdge } from './betweenness-calculator.service';
import { NetworkCentralityService, DeveloperReviewNode } from './network-centrality.service';

describe('NetworkCentralityService & BetweennessCalculatorService', () => {
  let betweennessCalc: BetweennessCalculatorService;
  let centralityService: NetworkCentralityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BetweennessCalculatorService, NetworkCentralityService],
    }).compile();

    betweennessCalc = module.get<BetweennessCalculatorService>(BetweennessCalculatorService);
    centralityService = module.get<NetworkCentralityService>(NetworkCentralityService);
  });

  describe('Brandes Betweenness Centrality on Bridge Topology', () => {
    it('identifies bridge bottleneck node with highest betweenness centrality', () => {
      // Classic dumbbell topology: Cluster 1 (A-B-C) connected via bridge D to Cluster 2 (E-F-G)
      // D is on every shortest path between Cluster 1 and Cluster 2 -> highest betweenness!
      const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const edges: GraphEdge[] = [
        { fromNode: 'A', toNode: 'B' },
        { fromNode: 'B', toNode: 'C' },
        { fromNode: 'A', toNode: 'C' },
        { fromNode: 'C', toNode: 'D' }, // bridge link
        { fromNode: 'D', toNode: 'E' }, // bridge link
        { fromNode: 'E', toNode: 'F' },
        { fromNode: 'F', toNode: 'G' },
        { fromNode: 'E', toNode: 'G' },
      ];

      const betweenness = betweennessCalc.computeBetweennessCentrality(nodes, edges);
      const scoreD = betweenness.get('D') || 0;
      const scoreA = betweenness.get('A') || 0;
      const scoreG = betweenness.get('G') || 0;

      expect(scoreD).toBeGreaterThan(scoreA);
      expect(scoreD).toBeGreaterThan(scoreG);
      expect(scoreD).toBeGreaterThanOrEqual(0.5); // Bridge node has dominant betweenness
    });
  });

  describe('Review Bottleneck and Gatekeeper Detection', () => {
    it('flags overloaded gatekeeper developer with high betweenness as a review bottleneck in < 500ms', () => {
      const reviewers: DeveloperReviewNode[] = [
        { developerId: 'lead_arch', name: 'Lead Architect', activeReviewsPending: 10 },
        { developerId: 'dev_1', name: 'Dev 1', activeReviewsPending: 1 },
        { developerId: 'dev_2', name: 'Dev 2', activeReviewsPending: 0 },
        { developerId: 'dev_3', name: 'Dev 3', activeReviewsPending: 2 },
        { developerId: 'dev_4', name: 'Dev 4', activeReviewsPending: 1 },
      ];

      // Star topology where lead_arch is the central reviewer
      const edges: GraphEdge[] = [
        { fromNode: 'dev_1', toNode: 'lead_arch' },
        { fromNode: 'dev_2', toNode: 'lead_arch' },
        { fromNode: 'dev_3', toNode: 'lead_arch' },
        { fromNode: 'dev_4', toNode: 'lead_arch' },
      ];

      const report = centralityService.analyzeReviewNetwork(reviewers, edges);
      expect(report.calculationDurationMs).toBeLessThan(500); // < 500ms benchmark
      expect(report.bottleneckCount).toBe(1);

      const leadResult = report.rankings.find((r) => r.developerId === 'lead_arch')!;
      expect(leadResult.isBottleneck).toBe(true);
      expect(leadResult.bottleneckSeverity).toBe('CRITICAL');
      expect(leadResult.recommendation).toContain('CRITICAL GATEKEEPER');
      expect(leadResult.betweennessCentrality).toBeGreaterThan(0.5);
    });
  });
});
