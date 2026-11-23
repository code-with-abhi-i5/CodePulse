export interface DatabaseShard {
  shardId: string;
  connectionString: string;
  isOnline: boolean;
  assignedVirtualShards: number[];
}

export interface ShardRoutingInfo {
  tenantId: string;
  virtualShardId: number;
  targetPhysicalShardId: string;
}
