/**
 * Architecture Service: Query Pipeline Batcher
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-44]
 */

export interface QueuedQuery<T = any> {
  id: string;
  sql: string;
  params: any[];
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export interface BatchExecutionReport {
  batchId: string;
  queryCount: number;
  durationMs: number;
}

export class QueryPipelineBatcherService {
  private queue: QueuedQuery[];
  private maxBatchSize: number;
  private maxWaitMs: number;
  private timer: any | null;
  private executor: (queries: QueuedQuery[]) => Promise<any[]>;

  constructor(
    executor?: (queries: QueuedQuery[]) => Promise<any[]>,
    maxBatchSize: number = 20,
    maxWaitMs: number = 10
  ) {
    this.queue = [];
    this.maxBatchSize = maxBatchSize;
    this.maxWaitMs = maxWaitMs;
    this.timer = null;
    this.executor = executor || (async (queries) => queries.map(q => ({ sql: q.sql, rows: [] })));
  }

  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queryItem: QueuedQuery<T> = {
        id: 'q_' + Math.random().toString(36).substr(2, 9),
        sql,
        params,
        resolve,
        reject
      };
      this.queue.push(queryItem);

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    });
  }

  public async flush(): Promise<BatchExecutionReport> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return { batchId: 'empty', queryCount: 0, durationMs: 0 };
    }

    const currentBatch = this.queue.splice(0, this.maxBatchSize);
    const start = Date.now();
    const batchId = 'batch_' + Math.random().toString(36).substr(2, 9);

    try {
      const results = await this.executor(currentBatch);
      for (let i = 0; i < currentBatch.length; i++) {
        currentBatch[i].resolve(results[i]);
      }
    } catch (err) {
      for (const q of currentBatch) {
        q.reject(err);
      }
    }

    return {
      batchId,
      queryCount: currentBatch.length,
      durationMs: Date.now() - start
    };
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
