import { Injectable } from '@nestjs/common';
import { RouteTarget } from '../../types/queues';

@Injectable()
export class ClusterRouterService {
  private readonly nodeRanges: Array<{ nodeId: string; start: number; end: number }> = [];

  computeHashSlot(key: string): number {
    let tag = key;
    const start = key.indexOf('{');
    const end = key.indexOf('}', start);
    if (start !== -1 && end !== -1 && end > start + 1) {
      tag = key.slice(start + 1, end);
    }

    let crc = 0x0000;
    for (let i = 0; i < tag.length; i++) {
      crc = (crc ^ (tag.charCodeAt(i) << 8)) & 0xffff;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc % 16384;
  }

  assignNodeSlots(nodeId: string, start: number, end: number): void {
    this.nodeRanges.push({ nodeId, start, end });
  }

  routeToNode(key: string): RouteTarget {
    const slot = this.computeHashSlot(key);
    for (const range of this.nodeRanges) {
      if (slot >= range.start && slot <= range.end) {
        return { slot, node: range.nodeId };
      }
    }
    return { slot, node: 'default-node' };
  }

  formatPinnedKey(battleId: string, eventType: string): string {
    return `{battle:${battleId}}:${eventType}`;
  }
}
