export interface QueryNode {
  id: string;
  region: string;
  partitions: string[];
}

export interface SubQueryPlan {
  nodeId: string;
  partition: string;
  pushdownFilters: string[];
  aggregation?: string;
}

export class AdaptiveFederatedQueryPlanner {
  private nodes: QueryNode[] = [];

  public registerNode(node: QueryNode): void {
    this.nodes.push(node);
  }

  public planQuery(table: string, filterPartitionKey: string, filters: string[], aggregation?: string): SubQueryPlan[] {
    const plans: SubQueryPlan[] = [];

    // Route sub-queries only to nodes that host the target partition
    for (const node of this.nodes) {
      if (node.partitions.includes(filterPartitionKey) || filterPartitionKey === '*') {
        plans.push({
          nodeId: node.id,
          partition: filterPartitionKey,
          pushdownFilters: filters,
          aggregation
        });
      }
    }

    if (plans.length === 0) {
      throw new Error(`No federated node available for partition '${filterPartitionKey}'`);
    }

    return plans;
  }

  public mergeResults(intermediateResults: number[][]): number[] {
    // Flatten and sort federated results
    return intermediateResults.flat().sort((a, b) => a - b);
  }
}
