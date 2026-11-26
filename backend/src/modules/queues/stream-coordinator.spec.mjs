import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class StreamCoordinatorService {
  constructor() {
    this.consumers = new Map();
  }

  registerConsumer(consumerId) {
    this.consumers.set(consumerId, { consumerId, lastHeartbeat: Date.now() });
  }

  heartbeat(consumerId) {
    const c = this.consumers.get(consumerId);
    if (c) c.lastHeartbeat = Date.now();
  }

  detectStalledConsumers(maxIdleMs = 10000) {
    const now = Date.now();
    const stalled = [];
    for (const [id, c] of this.consumers.entries()) {
      if (now - c.lastHeartbeat > maxIdleMs) stalled.push(id);
    }
    return stalled;
  }

  rebalancePartitions(activeConsumers, partitions) {
    const allocation = new Map();
    if (activeConsumers.length === 0) return allocation;
    for (const consumer of activeConsumers) allocation.set(consumer, []);
    partitions.forEach((partition, index) => {
      const consumer = activeConsumers[index % activeConsumers.length];
      allocation.get(consumer).push(partition);
    });
    return allocation;
  }
}

describe('StreamCoordinatorService', () => {
  it('detects stalled consumers and rebalances stream partitions evenly', () => {
    const service = new StreamCoordinatorService();
    service.registerConsumer('worker-1');
    service.registerConsumer('worker-2');
    service.consumers.get('worker-2').lastHeartbeat = Date.now() - 25000;

    const stalled = service.detectStalledConsumers(10000);
    assert.deepEqual(stalled, ['worker-2']);

    const balance = service.rebalancePartitions(['worker-1', 'worker-3'], [0, 1, 2, 3, 4]);
    assert.equal(balance.get('worker-1').length, 3);
    assert.equal(balance.get('worker-3').length, 2);
  });
});
