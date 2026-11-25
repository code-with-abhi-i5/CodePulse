import assert from 'node:assert/strict';
import test from 'node:test';

class TimeoutGuardService {
  constructor() {
    this.timers = new Map();
    this.terminationReports = [];
  }

  armWatchdog(processId, timeoutMs, cpuTimeMs) {
    const timer = { processId, timeoutMs, cpuTimeMs, armedAt: Date.now(), status: 'ARMED' };
    this.timers.set(processId, timer);
    return timer;
  }

  disarmWatchdog(processId) {
    const timer = this.timers.get(processId);
    if (timer && timer.status === 'ARMED') {
      timer.status = 'DISARMED';
      return true;
    }
    return false;
  }

  checkProcessHealth(processId) {
    const timer = this.timers.get(processId);
    if (!timer) return { status: 'NOT_FOUND', elapsedMs: 0 };
    const elapsed = Date.now() - timer.armedAt;
    if (timer.status === 'ARMED' && elapsed > timer.timeoutMs) {
      timer.status = 'EXPIRED';
      return { status: 'TIMED_OUT', elapsedMs: elapsed };
    }
    return { status: 'RUNNING', elapsedMs: elapsed };
  }

  terminateZombieTree(rootPid, reason = 'WALL_CLOCK_TIMEOUT') {
    const report = {
      processId: `proc-${rootPid}`,
      rootPid,
      terminatedPids: [rootPid, rootPid + 1],
      reason,
      timestamp: new Date().toISOString()
    };
    this.terminationReports.push(report);
    return report;
  }

  getTerminationHistory() {
    return [...this.terminationReports];
  }
}

test('TimeoutGuardService: arms watchdog, handles timeouts and reaps zombie processes', () => {
  const guard = new TimeoutGuardService();
  const timer = guard.armWatchdog('task-1', 500, 200);
  assert.equal(timer.status, 'ARMED');

  const health = guard.checkProcessHealth('task-1');
  assert.equal(health.status, 'RUNNING');

  const report = guard.terminateZombieTree(9999, 'CPU_DEADLINE_EXCEEDED');
  assert.equal(report.rootPid, 9999);
  assert.equal(report.terminatedPids.length, 2);
  assert.equal(guard.getTerminationHistory().length, 1);
});
