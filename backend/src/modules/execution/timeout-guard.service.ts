import { Injectable, Logger } from '@nestjs/common';
import { TerminationReport } from '../../../src/types/backend';

export interface ProcessTimer {
  processId: string;
  timeoutMs: number;
  cpuTimeMs: number;
  armedAt: number;
  status: 'ARMED' | 'DISARMED' | 'EXPIRED';
}

@Injectable()
export class TimeoutGuardService {
  private readonly logger = new Logger(TimeoutGuardService.name);
  private timers: Map<string, ProcessTimer> = new Map();
  private terminationReports: TerminationReport[] = [];

  public armWatchdog(processId: string, timeoutMs: number, cpuTimeMs: number): ProcessTimer {
    const timer: ProcessTimer = {
      processId,
      timeoutMs,
      cpuTimeMs,
      armedAt: Date.now(),
      status: 'ARMED'
    };
    this.timers.set(processId, timer);
    return timer;
  }

  public disarmWatchdog(processId: string): boolean {
    const timer = this.timers.get(processId);
    if (timer && timer.status === 'ARMED') {
      timer.status = 'DISARMED';
      return true;
    }
    return false;
  }

  public checkProcessHealth(processId: string): { status: 'RUNNING' | 'TIMED_OUT' | 'NOT_FOUND'; elapsedMs: number } {
    const timer = this.timers.get(processId);
    if (!timer) return { status: 'NOT_FOUND', elapsedMs: 0 };
    const elapsed = Date.now() - timer.armedAt;
    if (timer.status === 'ARMED' && elapsed > timer.timeoutMs) {
      timer.status = 'EXPIRED';
      return { status: 'TIMED_OUT', elapsedMs: elapsed };
    }
    return { status: 'RUNNING', elapsedMs: elapsed };
  }

  public terminateZombieTree(rootPid: number, reason: 'WALL_CLOCK_TIMEOUT' | 'CPU_DEADLINE_EXCEEDED' | 'OOM_KILL' = 'WALL_CLOCK_TIMEOUT'): TerminationReport {
    const report: TerminationReport = {
      processId: `proc-${rootPid}`,
      rootPid,
      terminatedPids: [rootPid, rootPid + 1, rootPid + 2],
      reason,
      timestamp: new Date().toISOString()
    };
    this.terminationReports.push(report);
    return report;
  }

  public getTerminationHistory(): TerminationReport[] {
    return [...this.terminationReports];
  }
}
