import { Injectable } from '@nestjs/common';
import { ScheduledTask } from '../../types/queues';

@Injectable()
export class ZsetSchedulerService {
  private readonly tasks: ScheduledTask[] = [];

  scheduleTask(taskId: string, executeAtEpochMs: number, payload: any): void {
    this.tasks.push({ taskId, executeAt: executeAtEpochMs, payload });
    this.tasks.sort((a, b) => a.executeAt - b.executeAt);
  }

  pollDueTasks(currentEpochMs: number, maxCount: number = 100): ScheduledTask[] {
    const due: ScheduledTask[] = [];
    while (this.tasks.length > 0 && this.tasks[0].executeAt <= currentEpochMs && due.length < maxCount) {
      due.push(this.tasks.shift()!);
    }
    return due;
  }

  cancelTask(taskId: string): boolean {
    const idx = this.tasks.findIndex(t => t.taskId === taskId);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  getQueueSize(): number {
    return this.tasks.length;
  }
}
