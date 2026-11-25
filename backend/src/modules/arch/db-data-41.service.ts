/**
 * Architecture Service: Database Bulk Insert Streaming Pipeline
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-41]
 */

export class DatabaseBulkInsertPipelineService<T> {
  private queue: T[];
  private batchSize: number;

  constructor(batchSize: number = 500) {
    this.queue = [];
    this.batchSize = batchSize;
  }

  public enqueue(items: T[]): void {
    this.queue.push(...items);
  }

  public async processBatches(
    batchWriter: (batch: T[]) => Promise<number>
  ): Promise<{ totalInserted: number; batchesCount: number }> {
    let totalInserted = 0;
    let batchesCount = 0;

    while (this.queue.length > 0) {
      const chunk = this.queue.splice(0, this.batchSize);
      const inserted = await batchWriter(chunk);
      totalInserted += inserted;
      batchesCount++;
    }

    return { totalInserted, batchesCount };
  }
}
