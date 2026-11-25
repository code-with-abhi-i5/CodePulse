/**
 * Architecture Service: ClickHouse Node Decommission Rebalancing Coordinator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-50]
 */

export interface PartitionSlice {
  tableName: string;
  partition: string;
  partCount: number;
}

export class ClickHouseDecommissionCoordinatorService {
  public planPartitionMigration(
    decommissioningNode: string,
    targetNodes: string[],
    slices: PartitionSlice[]
  ): Array<{ tableName: string; partition: string; targetNode: string; moveDdl: string }> {
    if (targetNodes.length === 0) throw new Error('At least one target node required for rebalancing');
    const migrationPlan: Array<{ tableName: string; partition: string; targetNode: string; moveDdl: string }> = [];

    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const target = targetNodes[i % targetNodes.length];
      const moveDdl = `ALTER TABLE ${slice.tableName} MOVE PARTITION '${slice.partition}' TO SHARD '${target}';`;

      migrationPlan.push({
        tableName: slice.tableName,
        partition: slice.partition,
        targetNode: target,
        moveDdl
      });
    }

    return migrationPlan;
  }
}
