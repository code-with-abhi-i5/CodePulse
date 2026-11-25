import { Injectable } from '@nestjs/common';
import { StreamConsumer } from '../../types/queues';

@Injectable()
export class StreamCoordinatorService {
  private readonly consumers: Map<string, StreamConsumer> = new Map();

  registerConsumer(consumerId: string): void {
    this.consumers.set(consumerId, { consumerId, lastHeartbeat: Date.now() });
  }

  heartbeat(consumerId: string): void {
    const c = this.consumers.get(consumerId);
    if (c) {
      c.lastHeartbeat = Date.now();
    }
  }

  detectStalledConsumers(maxIdleMs: number = 10000): string[] {
    const now = Date.now();
    const stalled: string[] = [];
    for (const [id, c] of this.consumers.entries()) {
      if (now - c.lastHeartbeat > maxIdleMs) {
        stalled.push(id);
      }
    }
    return stalled;
  }

  rebalancePartitions(activeConsumers: string[], partitions: number[]): Map<string, number[]> {
    const allocation = new Map<string, number[]>();
    if (activeConsumers.length === 0) return allocation;

    for (const consumer of activeConsumers) {
      allocation.set(consumer, []);
    }

    partitions.forEach((partition, index) => {
      const consumer = activeConsumers[index % activeConsumers.length];
      allocation.get(consumer)!.push(partition);
    });

    return allocation;
  }
}
