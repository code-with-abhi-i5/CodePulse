import { Test, TestingModule } from '@nestjs/testing';
import {
  ReplicaBalancerService,
  IReplicaClientAdapter,
} from './replica-balancer.service';
import { PrismaClient } from '@prisma/client';

class MockReplicaClientAdapter implements IReplicaClientAdapter {
  public connectedNodes: string[] = [];
  public disconnectedNodes: string[] = [];
  public nodeLags: Map<string, number> = new Map();
  public executedQueries: Array<{ nodeId: string }> = [];

  connect(nodeId: string): Promise<PrismaClient> {
    this.connectedNodes.push(nodeId);
    return Promise.resolve(new PrismaClient());
  }

  disconnect(nodeId: string): Promise<void> {
    this.disconnectedNodes.push(nodeId);
    return Promise.resolve();
  }

  probeLag(nodeId: string): Promise<number> {
    return Promise.resolve(this.nodeLags.get(nodeId) ?? 5);
  }

  executeOnClient<T>(
    nodeId: string,
    client: PrismaClient,
    action: (client: PrismaClient) => Promise<T>,
  ): Promise<T> {
    this.executedQueries.push({ nodeId });
    return action(client);
  }
}

describe('ReplicaBalancerService', () => {
  let service: ReplicaBalancerService;
  let mockAdapter: MockReplicaClientAdapter;

  beforeEach(async () => {
    mockAdapter = new MockReplicaClientAdapter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ReplicaBalancerService,
          useFactory: () => new ReplicaBalancerService(mockAdapter),
        },
      ],
    }).compile();

    service = module.get<ReplicaBalancerService>(ReplicaBalancerService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('Replica Cluster Initialization & Query Classification', () => {
    it('should initialize with 3 read replicas in healthy, active states', () => {
      const report = service.getClusterReport();
      expect(report.totalReplicas).toBe(3);
      expect(report.healthyReplicasCount).toBe(3);
      expect(report.isolatedReplicasCount).toBe(0);
      expect(report.globalAvgLagMs).toBe(5);

      const nodeIds = report.nodes.map((n) => n.id);
      expect(nodeIds).toContain('replica-us-east');
      expect(nodeIds).toContain('replica-eu-west');
      expect(nodeIds).toContain('replica-ap-south');
    });

    it('should classify queries into LIGHT, MEDIUM, and HEAVY categories with appropriate cost scores', () => {
      // LIGHT query: simple findUnique
      const light = service.classifyQueryComplexity('user.findUnique', {
        where: { id: 'u1' },
      });
      expect(light.complexity).toBe('LIGHT');
      expect(light.estimatedCostScore).toBe(1);

      // MEDIUM query: paginated findMany
      const medium = service.classifyQueryComplexity('commit.findMany', {
        take: 20,
        skip: 0,
      });
      expect(medium.complexity).toBe('MEDIUM');
      expect(medium.estimatedCostScore).toBe(5);

      // HEAVY query: analytical aggregation or large take
      const heavyGroupBy = service.classifyQueryComplexity(
        'analytics.groupBy',
        {},
      );
      expect(heavyGroupBy.complexity).toBe('HEAVY');
      expect(heavyGroupBy.estimatedCostScore).toBe(20);

      const heavyLargeBatch = service.classifyQueryComplexity('feed.findMany', {
        take: 100,
      });
      expect(heavyLargeBatch.complexity).toBe('HEAVY');
      expect(heavyLargeBatch.estimatedCostScore).toBe(20);

      const heavyDeepInclude = service.classifyQueryComplexity(
        'user.findUnique',
        {
          include: { profile: true, badges: true, repos: true },
        },
      );
      expect(heavyDeepInclude.complexity).toBe('HEAVY');
      expect(heavyDeepInclude.estimatedCostScore).toBe(20);
    });
  });

  describe('Cost-Weighted Routing & Load Balancing', () => {
    it('should route queries to the replica with the lowest instantaneous load score', () => {
      // Artificially increase load on replica-us-east and replica-eu-west
      const usEast = service.getReplicaStatus('replica-us-east')!;
      const euWest = service.getReplicaStatus('replica-eu-west')!;
      const apSouth = service.getReplicaStatus('replica-ap-south')!;

      usEast.currentLoadScore = 20; // HEAVY running
      euWest.currentLoadScore = 15; // 3 MEDIUMs running
      apSouth.currentLoadScore = 1; // 1 LIGHT running

      // When routing a new query, ap-south has the lowest score (1)
      const selected = service.selectOptimalReplica();
      expect(selected.id).toBe('replica-ap-south');
    });

    it('should track active query load during execution and decrement safely upon completion', async () => {
      let activeScoreObserved = 0;
      let activeQueriesObserved = 0;

      await service.executeRead('analytics.groupBy', {}, () => {
        // Inside action: active load should reflect HEAVY cost (20)
        const node = service.getReplicaStatus('replica-us-east')!;
        activeScoreObserved = node.currentLoadScore;
        activeQueriesObserved = node.activeQueriesCount;
        return Promise.resolve({ data: 'ok' });
      });

      expect(activeScoreObserved).toBe(20);
      expect(activeQueriesObserved).toBe(1);

      // After execution finishes, load score must return to 0
      const nodeAfter = service.getReplicaStatus('replica-us-east')!;
      expect(nodeAfter.currentLoadScore).toBe(0);
      expect(nodeAfter.activeQueriesCount).toBe(0);
      expect(nodeAfter.totalQueriesProcessed).toBe(1);
    });

    it('should prevent replica saturation by distributing consecutive heavy and light queries across nodes', async () => {
      // Execute 3 queries simultaneously
      const promise1 = service.executeRead(
        'analytics.groupBy',
        {},
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return 1;
        },
      );

      // While promise1 is running on node 1 (load=20), node 2 (load=0) should be chosen for query 2
      const promise2 = service.executeRead(
        'analytics.groupBy',
        {},
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return 2;
        },
      );

      // Query 3 should be dispatched to node 3 (load=0)
      const promise3 = service.executeRead('user.findUnique', {}, () => {
        return Promise.resolve(3);
      });

      await Promise.all([promise1, promise2, promise3]);

      const executedNodes = mockAdapter.executedQueries.map((q) => q.nodeId);
      expect(executedNodes).toContain('replica-us-east');
      expect(executedNodes).toContain('replica-eu-west');
      expect(executedNodes).toContain('replica-ap-south');
    });
  });

  describe('Active Health Probes & Replication Lag Isolation (> 100ms)', () => {
    it('should isolate a replica if its replication lag exceeds 100ms threshold', async () => {
      mockAdapter.nodeLags.set('replica-eu-west', 185); // 185ms > 100ms threshold

      await service.runClusterHealthProbe();

      const euWest = service.getReplicaStatus('replica-eu-west')!;
      expect(euWest.isIsolated).toBe(true);
      expect(euWest.replicationLagMs).toBe(185);
      expect(euWest.isolationReason).toContain('exceeds threshold of 100ms');

      const report = service.getClusterReport();
      expect(report.isolatedReplicasCount).toBe(1);
      expect(report.healthyReplicasCount).toBe(2);

      // Next query should NOT be routed to isolated replica-eu-west
      const selected = service.selectOptimalReplica();
      expect(selected.id).not.toBe('replica-eu-west');
    });

    it('should automatically re-admit an isolated replica once lag falls below 100ms', async () => {
      // First isolate replica-eu-west
      service.simulateReplicaStatus('replica-eu-west', 150, true);
      expect(service.getReplicaStatus('replica-eu-west')!.isIsolated).toBe(
        true,
      );

      // Probe detects lag returned to 8ms
      mockAdapter.nodeLags.set('replica-eu-west', 8);
      await service.runClusterHealthProbe();

      const euWest = service.getReplicaStatus('replica-eu-west')!;
      expect(euWest.isIsolated).toBe(false);
      expect(euWest.replicationLagMs).toBe(8);
    });

    it('should fall back gracefully to the least-lagging node if all replicas are isolated', () => {
      service.simulateReplicaStatus('replica-us-east', 250, true);
      service.simulateReplicaStatus('replica-eu-west', 320, true);
      service.simulateReplicaStatus('replica-ap-south', 120, true);

      // All nodes isolated. ap-south has least lag (120ms)
      const selected = service.selectOptimalReplica();
      expect(selected).toBeDefined();
      expect(selected.id).toBe('replica-ap-south');
    });
  });

  describe('Prometheus Metrics Export', () => {
    it('should export Prometheus metrics format for replica cluster load and lag', () => {
      const metrics = service.exportPrometheusMetrics();

      expect(metrics).toContain('codepulse_db_replica_load_score');
      expect(metrics).toContain('codepulse_db_replica_active_queries');
      expect(metrics).toContain('codepulse_db_replica_lag_ms');
      expect(metrics).toContain('codepulse_db_replica_is_isolated');
      expect(metrics).toContain('codepulse_db_replica_queries_total');
      expect(metrics).toContain('node_id="replica-us-east"');
    });
  });
});
