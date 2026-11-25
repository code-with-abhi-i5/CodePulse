/**
 * Architecture Service: ClickHouse Distributed Table Query Routing Optimizer
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-25]
 */

export class ClickHouseDistributedQueryOptimizerService {
  private shardingKey: string;

  constructor(shardingKey: string = 'tenant_id') {
    this.shardingKey = shardingKey;
  }

  public optimizeQuery(rawQuery: string): {
    isOptimized: boolean;
    fansOutToAllNodes: boolean;
    query: string;
    warning?: string;
  } {
    const keyPattern = new RegExp(`\\b${this.shardingKey}\\s*=`, 'i');
    const hasShardingKey = keyPattern.test(rawQuery);

    if (!hasShardingKey) {
      return {
        isOptimized: false,
        fansOutToAllNodes: true,
        query: rawQuery,
        warning: `Distributed query lacks sharding key '${this.shardingKey}' in WHERE clause, causing full cluster node fan-out.`
      };
    }

    return {
      isOptimized: true,
      fansOutToAllNodes: false,
      query: rawQuery
    };
  }
}
