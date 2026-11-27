import crypto from 'crypto';

export interface PartitionedEvent<T = any> {
  id: string;
  topic: string;
  partitionKey: string;
  payload: T;
  timestamp: number;
}

export class EventMeshTopicRouter {
  private partitionCount: number;
  private queues = new Map<string, PartitionedEvent[]>(); // partitionId -> events

  constructor(partitionCount = 8) {
    this.partitionCount = partitionCount;
    for (let i = 0; i < partitionCount; i++) {
      this.queues.set(`p-${i}`, []);
    }
  }

  public computePartition(partitionKey: string): string {
    const hash = crypto.createHash('md5').update(partitionKey).digest().readUInt32BE(0);
    const partitionIndex = hash % this.partitionCount;
    return `p-${partitionIndex}`;
  }

  public publish(topic: string, partitionKey: string, payload: any): PartitionedEvent {
    const partitionId = this.computePartition(partitionKey);
    const event: PartitionedEvent = {
      id: crypto.randomUUID(),
      topic,
      partitionKey,
      payload,
      timestamp: Date.now()
    };

    const queue = this.queues.get(partitionId) || [];
    queue.push(event);
    this.queues.set(partitionId, queue);

    return event;
  }

  public consumePartition(partitionId: string, batchSize = 10): PartitionedEvent[] {
    const queue = this.queues.get(partitionId) || [];
    return queue.splice(0, batchSize);
  }

  public getQueueDepth(partitionId: string): number {
    return (this.queues.get(partitionId) || []).length;
  }
}
