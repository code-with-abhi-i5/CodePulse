import { Injectable } from '@nestjs/common';

@Injectable()
export class SigtermDrainService {
  private readonly activeTasks: Set<string> = new Set();
  private isTerminating: boolean = false;

  registerInFlightTask(taskId: string): void {
    if (this.isTerminating) {
      throw new Error('Server is terminating. Cannot accept new tasks.');
    }
    this.activeTasks.add(taskId);
  }

  completeTask(taskId: string): void {
    this.activeTasks.delete(taskId);
  }

  isShuttingDown(): boolean {
    return this.isTerminating;
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  async triggerGracefulShutdown(timeoutMs: number = 5000): Promise<{ success: boolean; drainedCount: number }> {
    this.isTerminating = true;
    const start = Date.now();
    let initialCount = this.activeTasks.size;

    while (this.activeTasks.size > 0 && (Date.now() - start) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return {
      success: this.activeTasks.size === 0,
      drainedCount: initialCount - this.activeTasks.size,
    };
  }
}
