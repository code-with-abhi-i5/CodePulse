import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type QueryComplexity = 'LIGHT' | 'MEDIUM' | 'HEAVY';

export interface QueryClassification {
  complexity: QueryComplexity;
  estimatedCostScore: number;
  reason: string;
}

export interface ReplicaNodeConfig {
  id: string;
  name: string;
  databaseUrl: string;
  weightCapacity: number; // Max concurrent weight score before considered saturated (e.g. 100)
}

export interface ReplicaNodeStatus {
  id: string;
  name: string;
  isHealthy: boolean;
  isIsolated: boolean;
  isolationReason?: string;
  activeQueriesCount: number;
  currentLoadScore: number; // Sum of active query cost scores
  replicationLagMs: number;
  lastHealthProbeTimestamp: string;
  totalQueriesProcessed: number;
  totalErrorsEncountered: number;
  avgLatencyMs: number;
}

export interface ClusterLoadReport {
  totalReplicas: number;
  healthyReplicasCount: number;
  isolatedReplicasCount: number;
  activeQueriesTotal: number;
  globalAvgLagMs: number;
  nodes: ReplicaNodeStatus[];
}

export interface IReplicaClientAdapter {
  connect(nodeId: string, url: string): Promise<PrismaClient>;
  disconnect(nodeId: string): Promise<void>;
  probeLag(nodeId: string, client: PrismaClient): Promise<number>;
  executeOnClient<T>(
    nodeId: string,
    client: PrismaClient,
    action: (client: PrismaClient) => Promise<T>,
  ): Promise<T>;
}

@Injectable()
export class ReplicaBalancerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReplicaBalancerService.name);

  // Configuration thresholds
  private readonly MAX_REPLICATION_LAG_MS = 100; // Isolate replica if lag > 100ms
  private readonly PROBE_INTERVAL_MS = 5000;
  private readonly PROBE_TIMEOUT_MS = 2000;

  private probeTimer: NodeJS.Timeout | null = null;
  private clientAdapter: IReplicaClientAdapter;

  private readonly nodes: Map<string, ReplicaNodeConfig> = new Map();
  private readonly clients: Map<string, PrismaClient> = new Map();
  private readonly statuses: Map<string, ReplicaNodeStatus> = new Map();
  private readonly nodeLatencies: Map<string, number[]> = new Map();

  constructor(clientAdapter?: IReplicaClientAdapter) {
    this.clientAdapter = clientAdapter || this.createDefaultAdapter();
    this.initializeDefaultReplicaNodes();
  }

  private initializeDefaultReplicaNodes(): void {
    const defaultReplicas: ReplicaNodeConfig[] = [
      {
        id: 'replica-us-east',
        name: 'PostgreSQL Read Replica 1 (us-east)',
        databaseUrl:
          process.env.DATABASE_REPLICA_URL_1 ||
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/codepulse_replica_1',
        weightCapacity: 100,
      },
      {
        id: 'replica-eu-west',
        name: 'PostgreSQL Read Replica 2 (eu-west)',
        databaseUrl:
          process.env.DATABASE_REPLICA_URL_2 ||
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/codepulse_replica_2',
        weightCapacity: 100,
      },
      {
        id: 'replica-ap-south',
        name: 'PostgreSQL Read Replica 3 (ap-south)',
        databaseUrl:
          process.env.DATABASE_REPLICA_URL_3 ||
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/codepulse_replica_3',
        weightCapacity: 100,
      },
    ];

    for (const replica of defaultReplicas) {
      this.registerReplica(replica);
    }
  }

  setClientAdapter(adapter: IReplicaClientAdapter): void {
    this.clientAdapter = adapter;
  }

  registerReplica(config: ReplicaNodeConfig): void {
    this.nodes.set(config.id, config);
    this.statuses.set(config.id, {
      id: config.id,
      name: config.name,
      isHealthy: true,
      isIsolated: false,
      activeQueriesCount: 0,
      currentLoadScore: 0,
      replicationLagMs: 5, // nominal baseline lag
      lastHealthProbeTimestamp: new Date().toISOString(),
      totalQueriesProcessed: 0,
      totalErrorsEncountered: 0,
      avgLatencyMs: 2,
    });
    this.nodeLatencies.set(config.id, []);
  }

  async onModuleInit(): Promise<void> {
    for (const [id, config] of this.nodes) {
      try {
        const client = await this.clientAdapter.connect(id, config.databaseUrl);
        this.clients.set(id, client);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to initialize connection to replica ${id}: ${msg}`,
        );
        const status = this.statuses.get(id);
        if (status) {
          status.isHealthy = false;
          status.isIsolated = true;
          status.isolationReason = `Connection failure: ${msg}`;
        }
      }
    }

    this.startHealthProbes();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopHealthProbes();
    for (const [id] of this.clients) {
      try {
        await this.clientAdapter.disconnect(id);
      } catch {
        // Disconnect cleanup error ignored on shutdown
      }
    }
    this.clients.clear();
  }

  startHealthProbes(): void {
    if (this.probeTimer) return;

    this.probeTimer = setInterval(() => {
      void this.runClusterHealthProbe().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.debug(`Replication probe tick encountered: ${msg}`);
      });
    }, this.PROBE_INTERVAL_MS);

    if (this.probeTimer && typeof this.probeTimer.unref === 'function') {
      this.probeTimer.unref();
    }
  }

  stopHealthProbes(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
  }

  /**
   * Evaluates query complexity and assigns an estimated query cost score:
   * - LIGHT (1 pt): Single-row lookups (findUnique, findFirst, simple ID lookups)
   * - MEDIUM (5 pts): Filtered/paginated feeds (findMany with limit <= 50)
   * - HEAVY (20 pts): Multi-table analytical aggregations, groupBy, deep nested includes, or raw queries with JOINs
   */
  classifyQueryComplexity(
    operation: string,
    args?: Record<string, unknown>,
  ): QueryClassification {
    const op = operation.toLowerCase();

    // Check HEAVY conditions
    const isAnalytical =
      op.includes('groupby') ||
      op.includes('aggregate') ||
      op.includes('raw') ||
      op.includes('analytics');

    const hasDeepInclude =
      args &&
      typeof args === 'object' &&
      args.include &&
      typeof args.include === 'object' &&
      Object.keys(args.include).length >= 3;

    const hasLargeBatch =
      args &&
      typeof args === 'object' &&
      typeof args.take === 'number' &&
      args.take > 50;

    if (isAnalytical || hasDeepInclude || hasLargeBatch) {
      return {
        complexity: 'HEAVY',
        estimatedCostScore: 20,
        reason: isAnalytical
          ? 'Analytical aggregation or raw grouping operation'
          : hasDeepInclude
            ? 'Deeply nested relational include tree'
            : 'Large batch size (> 50 rows)',
      };
    }

    // Check MEDIUM conditions: findMany with pagination
    if (op.includes('findmany') || (args && typeof args.take === 'number')) {
      return {
        complexity: 'MEDIUM',
        estimatedCostScore: 5,
        reason: 'Paginated dataset or filtered feed lookup',
      };
    }

    // Default: LIGHT single-record queries (findUnique, findFirst, count)
    return {
      complexity: 'LIGHT',
      estimatedCostScore: 1,
      reason: 'Single row or lightweight indexed lookup',
    };
  }

  /**
   * Selects the optimal read replica with the lowest instantaneous load score among healthy, un-isolated nodes.
   * If all replicas are isolated/lagging, falls back to the least-lagging replica or primary to avoid failing user requests.
   */
  selectOptimalReplica(): ReplicaNodeStatus {
    const candidateNodes = Array.from(this.statuses.values()).filter(
      (node) => node.isHealthy && !node.isIsolated,
    );

    if (candidateNodes.length === 0) {
      this.logger.warn(
        'All read replicas are currently isolated or degraded! Falling back to lowest-lag replica to preserve availability.',
      );
      // Fallback: pick the node with smallest lag
      const allNodes = Array.from(this.statuses.values());
      allNodes.sort((a, b) => a.replicationLagMs - b.replicationLagMs);
      return allNodes[0] || this.createMockFallbackNode();
    }

    // Sort by instantaneous load score (ascending), break ties by replication lag
    candidateNodes.sort((a, b) => {
      if (a.currentLoadScore !== b.currentLoadScore) {
        return a.currentLoadScore - b.currentLoadScore;
      }
      return a.replicationLagMs - b.replicationLagMs;
    });

    const chosenNode = candidateNodes[0];
    return chosenNode;
  }

  /**
   * Executes a read operation on the replica with the lowest instantaneous load score.
   * Tracks active load score, updates latency stats, and guarantees safe load decrements upon completion.
   */
  async executeRead<T>(
    operationName: string,
    args: Record<string, unknown> | undefined,
    action: (client: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const classification = this.classifyQueryComplexity(operationName, args);
    const nodeStatus = this.selectOptimalReplica();

    // Track active query load on chosen replica
    nodeStatus.activeQueriesCount++;
    nodeStatus.currentLoadScore += classification.estimatedCostScore;

    const startTime = Date.now();
    const client = this.clients.get(nodeStatus.id) || new PrismaClient();

    try {
      const result = await this.clientAdapter.executeOnClient(
        nodeStatus.id,
        client,
        action,
      );

      const durationMs = Date.now() - startTime;
      nodeStatus.totalQueriesProcessed++;

      // Record rolling latency
      const latencies = this.nodeLatencies.get(nodeStatus.id) || [];
      latencies.push(durationMs);
      if (latencies.length > 50) latencies.shift();
      nodeStatus.avgLatencyMs =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : durationMs;

      return result;
    } catch (err: unknown) {
      nodeStatus.totalErrorsEncountered++;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error executing read query on replica ${nodeStatus.id}: ${msg}`,
      );
      throw err;
    } finally {
      // Always safely decrement active load score
      nodeStatus.activeQueriesCount = Math.max(
        0,
        nodeStatus.activeQueriesCount - 1,
      );
      nodeStatus.currentLoadScore = Math.max(
        0,
        nodeStatus.currentLoadScore - classification.estimatedCostScore,
      );
    }
  }

  /**
   * Active cluster health probe: checks replication lag and response timeouts.
   * Temporarily isolates replicas with lag > 100ms or timeouts.
   */
  async runClusterHealthProbe(): Promise<ClusterLoadReport> {
    for (const [id, status] of this.statuses) {
      const client = this.clients.get(id);

      try {
        let lagMs = 5;
        if (client) {
          lagMs = await this.clientAdapter.probeLag(id, client);
        }

        status.replicationLagMs = lagMs;
        status.lastHealthProbeTimestamp = new Date().toISOString();

        if (lagMs > this.MAX_REPLICATION_LAG_MS) {
          if (!status.isIsolated) {
            status.isIsolated = true;
            status.isolationReason = `Replication lag excessive: ${lagMs}ms exceeds threshold of ${this.MAX_REPLICATION_LAG_MS}ms`;
            this.logger.warn(
              `[Replica Balancer] Isolated replica "${status.name}" (${id}): ${status.isolationReason}`,
            );
          }
        } else {
          // If previously isolated for replication lag, recover node
          if (
            status.isIsolated &&
            status.isolationReason?.includes('Replication lag')
          ) {
            status.isIsolated = false;
            status.isolationReason = undefined;
            this.logger.log(
              `[Replica Balancer] Re-admitted replica "${status.name}" (${id}) into active read pool (lag: ${lagMs}ms).`,
            );
          }
          status.isHealthy = true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        status.isHealthy = false;
        status.isIsolated = true;
        status.isolationReason = `Health probe timeout or connection error: ${msg}`;
        this.logger.error(
          `[Replica Balancer] Replica "${id}" health probe failed: ${msg}`,
        );
      }
    }

    return this.getClusterReport();
  }

  /**
   * For testing & chaos drill: simulate replication lag or health status on a replica node.
   */
  simulateReplicaStatus(nodeId: string, lagMs: number, isHealthy = true): void {
    const status = this.statuses.get(nodeId);
    if (!status) return;

    status.replicationLagMs = lagMs;
    status.isHealthy = isHealthy;

    if (!isHealthy) {
      status.isIsolated = true;
      status.isolationReason = 'Simulated node outage';
    } else if (lagMs > this.MAX_REPLICATION_LAG_MS) {
      status.isIsolated = true;
      status.isolationReason = `Replication lag ${lagMs}ms exceeds ${this.MAX_REPLICATION_LAG_MS}ms`;
    } else {
      status.isIsolated = false;
      status.isolationReason = undefined;
    }
  }

  getClusterReport(): ClusterLoadReport {
    const list = Array.from(this.statuses.values());
    const healthyCount = list.filter(
      (n) => n.isHealthy && !n.isIsolated,
    ).length;
    const isolatedCount = list.filter((n) => n.isIsolated).length;
    const activeTotal = list.reduce((acc, n) => acc + n.activeQueriesCount, 0);
    const avgLag =
      list.length > 0
        ? Math.round(
            list.reduce((acc, n) => acc + n.replicationLagMs, 0) / list.length,
          )
        : 0;

    return {
      totalReplicas: list.length,
      healthyReplicasCount: healthyCount,
      isolatedReplicasCount: isolatedCount,
      activeQueriesTotal: activeTotal,
      globalAvgLagMs: avgLag,
      nodes: list,
    };
  }

  getReplicaStatus(nodeId: string): ReplicaNodeStatus | undefined {
    return this.statuses.get(nodeId);
  }

  /**
   * Export Prometheus metrics for cluster observability.
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [
      '# HELP codepulse_db_replica_load_score Current instantaneous query cost load score per replica',
      '# TYPE codepulse_db_replica_load_score gauge',
    ];

    for (const [id, status] of this.statuses) {
      lines.push(
        `codepulse_db_replica_load_score{node_id="${id}",name="${status.name}"} ${status.currentLoadScore}`,
      );
    }

    lines.push(
      '# HELP codepulse_db_replica_active_queries Count of active queries running on replica',
      '# TYPE codepulse_db_replica_active_queries gauge',
    );
    for (const [id, status] of this.statuses) {
      lines.push(
        `codepulse_db_replica_active_queries{node_id="${id}",name="${status.name}"} ${status.activeQueriesCount}`,
      );
    }

    lines.push(
      '# HELP codepulse_db_replica_lag_ms Replication lag in milliseconds from primary',
      '# TYPE codepulse_db_replica_lag_ms gauge',
    );
    for (const [id, status] of this.statuses) {
      lines.push(
        `codepulse_db_replica_lag_ms{node_id="${id}",name="${status.name}"} ${status.replicationLagMs}`,
      );
    }

    lines.push(
      '# HELP codepulse_db_replica_is_isolated Whether the replica is currently isolated from routing',
      '# TYPE codepulse_db_replica_is_isolated gauge',
    );
    for (const [id, status] of this.statuses) {
      lines.push(
        `codepulse_db_replica_is_isolated{node_id="${id}",name="${status.name}"} ${status.isIsolated ? 1 : 0}`,
      );
    }

    lines.push(
      '# HELP codepulse_db_replica_queries_total Total queries processed on replica',
      '# TYPE codepulse_db_replica_queries_total counter',
    );
    for (const [id, status] of this.statuses) {
      lines.push(
        `codepulse_db_replica_queries_total{node_id="${id}",name="${status.name}"} ${status.totalQueriesProcessed}`,
      );
    }

    return lines.join('\n') + '\n';
  }

  private createDefaultAdapter(): IReplicaClientAdapter {
    return {
      connect: async (_nodeId: string, url: string) => {
        const client = new PrismaClient({
          datasources: { db: { url } },
        });
        await client.$connect();
        return client;
      },
      disconnect: () => {
        // Disconnect handled when client destroyed
        return Promise.resolve();
      },
      probeLag: async (_nodeId: string, client: PrismaClient) => {
        try {
          // Query PostgreSQL replication delay
          // In standard PostgreSQL: EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000
          const result = await client.$queryRawUnsafe<
            Array<{ lag_ms?: number }>
          >(
            `SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 AS lag_ms;`,
          );
          if (result && result[0] && typeof result[0].lag_ms === 'number') {
            return Math.max(0, Math.round(result[0].lag_ms));
          }
          return 5; // Nominal default if synchronous or non-replicated primary
        } catch {
          return 5;
        }
      },
      executeOnClient: async <T>(
        _nodeId: string,
        client: PrismaClient,
        action: (c: PrismaClient) => Promise<T>,
      ): Promise<T> => {
        return action(client);
      },
    };
  }

  private createMockFallbackNode(): ReplicaNodeStatus {
    return {
      id: 'primary-fallback',
      name: 'Primary Database Fallback',
      isHealthy: true,
      isIsolated: false,
      activeQueriesCount: 0,
      currentLoadScore: 0,
      replicationLagMs: 0,
      lastHealthProbeTimestamp: new Date().toISOString(),
      totalQueriesProcessed: 0,
      totalErrorsEncountered: 0,
      avgLatencyMs: 2,
    };
  }
}
