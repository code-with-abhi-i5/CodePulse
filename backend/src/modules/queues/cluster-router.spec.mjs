import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ClusterRouterService {
  constructor() {
    this.nodeRanges = [];
  }

  computeHashSlot(key) {
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

  assignNodeSlots(nodeId, start, end) {
    this.nodeRanges.push({ nodeId, start, end });
  }

  routeToNode(key) {
    const slot = this.computeHashSlot(key);
    for (const range of this.nodeRanges) {
      if (slot >= range.start && slot <= range.end) {
        return { slot, node: range.nodeId };
      }
    }
    return { slot, node: 'default-node' };
  }

  formatPinnedKey(battleId, eventType) {
    return `{battle:${battleId}}:${eventType}`;
  }
}

describe('ClusterRouterService', () => {
  it('consistently hashes tagged keys to identical slots and routes to correct nodes', () => {
    const service = new ClusterRouterService();
    service.assignNodeSlots('redis-shard-0', 0, 8191);
    service.assignNodeSlots('redis-shard-1', 8192, 16383);

    const k1 = service.formatPinnedKey('arena-99', 'queue');
    const k2 = service.formatPinnedKey('arena-99', 'dlq');
    assert.equal(service.computeHashSlot(k1), service.computeHashSlot(k2));

    const route = service.routeToNode(k1);
    assert.ok(route.slot >= 0 && route.slot < 16384);
    assert.ok(['redis-shard-0', 'redis-shard-1'].includes(route.node));
  });
});
