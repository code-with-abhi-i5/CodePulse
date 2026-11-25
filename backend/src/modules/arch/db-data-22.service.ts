/**
 * Architecture Service: Dynamic Database Shard Routing Gateway
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-22]
 */

import crypto from 'node:crypto';

export class DynamicDatabaseShardRouterService {
  private shards: string[];
  private virtualNodes: Map<number, string>;
  private sortedHashes: number[];

  constructor(shards: string[] = ['shard-0', 'shard-1', 'shard-2'], replicasPerShard: number = 50) {
    this.shards = shards;
    this.virtualNodes = new Map();

    for (const shard of shards) {
      for (let i = 0; i < replicasPerShard; i++) {
        const hash = this.hashKey(`${shard}:vnode:${i}`);
        this.virtualNodes.set(hash, shard);
      }
    }

    this.sortedHashes = Array.from(this.virtualNodes.keys()).sort((a, b) => a - b);
  }

  private hashKey(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest();
    return hash.readUInt32BE(0);
  }

  public getShardForTenant(tenantId: string): string {
    if (this.sortedHashes.length === 0) throw new Error('No shards available');
    const tenantHash = this.hashKey(tenantId);

    for (const h of this.sortedHashes) {
      if (tenantHash <= h) {
        return this.virtualNodes.get(h)!;
      }
    }

    return this.virtualNodes.get(this.sortedHashes[0])!;
  }
}
