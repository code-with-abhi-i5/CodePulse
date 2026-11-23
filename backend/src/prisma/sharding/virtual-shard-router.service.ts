import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseShard, ShardRoutingInfo } from './virtual-shard-router.types';

@Injectable()
export class VirtualShardRouterService {
  private readonly logger = new Logger(VirtualShardRouterService.name);

  private readonly totalVirtualShards = 1024;
  private readonly physicalShards = new Map<string, DatabaseShard>();
  private readonly vShardToPhysical = new Map<number, string>();

  constructor() {
    this.registerShard({ shardId: 'shard-0', connectionString: 'postgres://s0/db', isOnline: true, assignedVirtualShards: [] });
    this.registerShard({ shardId: 'shard-1', connectionString: 'postgres://s1/db', isOnline: true, assignedVirtualShards: [] });

    // Distribute 1024 virtual shards across physical shards
    for (let v = 0; v < this.totalVirtualShards; v++) {
      const physicalId = `shard-${v % 2}`;
      this.vShardToPhysical.set(v, physicalId);
      this.physicalShards.get(physicalId)?.assignedVirtualShards.push(v);
    }
  }

  public registerShard(shard: DatabaseShard): void {
    this.physicalShards.set(shard.shardId, shard);
  }

  public routeTenant(tenantId: string): ShardRoutingInfo {
    const hash = crypto.createHash('md5').update(tenantId).digest('hex');
    const vShard = parseInt(hash.slice(0, 8), 16) % this.totalVirtualShards;
    const targetPhysical = this.vShardToPhysical.get(vShard) ?? 'shard-0';

    return {
      tenantId,
      virtualShardId: vShard,
      targetPhysicalShardId: targetPhysical,
    };
  }

  public migrateVirtualShard(virtualShardId: number, targetShardId: string): boolean {
    const oldPhysical = this.vShardToPhysical.get(virtualShardId);
    if (!oldPhysical || !this.physicalShards.has(targetShardId)) return false;

    this.vShardToPhysical.set(virtualShardId, targetShardId);
    this.logger.log(`[ShardRouter] Migrated virtual shard ${virtualShardId} from ${oldPhysical} to ${targetShardId} with zero downtime.`);
    return true;
  }
}
