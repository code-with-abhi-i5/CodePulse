/**
 * Architecture Service: Compiler Worker Thread Pool
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-05]
 */

export interface CompilationTask {
  id: string;
  code: string;
  language: string;
  priority: 'high' | 'normal';
}

export class CompilerWorkerThreadPoolService {
  private maxWorkers: number;
  private activeWorkers: number;
  private queue: CompilationTask[];

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
  }

  public submitTask(task: CompilationTask): { status: 'dispatched' | 'queued'; activeWorkers: number; queueLength: number } {
    if (this.activeWorkers < this.maxWorkers) {
      this.activeWorkers++;
      return { status: 'dispatched', activeWorkers: this.activeWorkers, queueLength: this.queue.length };
    }

    if (task.priority === 'high') {
      this.queue.unshift(task);
    } else {
      this.queue.push(task);
    }
    return { status: 'queued', activeWorkers: this.activeWorkers, queueLength: this.queue.length };
  }

  public onWorkerComplete(): CompilationTask | null {
    if (this.activeWorkers > 0) {
      this.activeWorkers--;
    }
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift()!;
      this.activeWorkers++;
      return nextTask;
    }
    return null;
  }

  public getPoolStats(): { maxWorkers: number; activeWorkers: number; queueDepth: number } {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      queueDepth: this.queue.length
    };
  }
}
