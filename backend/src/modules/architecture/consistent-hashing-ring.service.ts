import crypto from 'crypto';

export interface RingNode {
  id: string;
  weight?: number;
}

export class ConsistentHashingRing {
  private vnodesPerNode: number;
  private ring: { hash: number; nodeId: string }[] = [];
  private nodes = new Set<string>();

  constructor(vnodesPerNode = 100) {
    this.vnodesPerNode = vnodesPerNode;
  }

  private hash(key: string): number {
    const digest = crypto.createHash('md5').update(key).digest();
    return digest.readUInt32BE(0);
  }

  public addNode(nodeId: string, weight = 1): void {
    if (this.nodes.has(nodeId)) return;
    this.nodes.add(nodeId);

    const vnodeCount = Math.floor(this.vnodesPerNode * weight);
    for (let i = 0; i < vnodeCount; i++) {
      const vnodeKey = `${nodeId}#vnode-${i}`;
      const h = this.hash(vnodeKey);
      this.ring.push({ hash: h, nodeId });
    }

    this.ring.sort((a, b) => a.hash - b.hash);
  }

  public removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) return;
    this.nodes.delete(nodeId);
    this.ring = this.ring.filter(item => item.nodeId !== nodeId);
  }

  public getNode(key: string): string | null {
    if (this.ring.length === 0) return null;
    const h = this.hash(key);

    // Binary search for first ring node >= h
    let low = 0;
    let high = this.ring.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= h) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    // Wrap around to 0 if beyond ring
    const index = low < this.ring.length ? low : 0;
    return this.ring[index].nodeId;
  }

  public getReplicationNodes(key: string, count: number): string[] {
    if (this.ring.length === 0) return [];
    const targetCount = Math.min(count, this.nodes.size);
    const h = this.hash(key);

    let low = 0;
    let high = this.ring.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= h) high = mid - 1;
      else low = mid + 1;
    }

    let startIndex = low < this.ring.length ? low : 0;
    const result: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < this.ring.length && result.length < targetCount; i++) {
      const curr = this.ring[(startIndex + i) % this.ring.length];
      if (!seen.has(curr.nodeId)) {
        seen.add(curr.nodeId);
        result.push(curr.nodeId);
      }
    }

    return result;
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }
}
