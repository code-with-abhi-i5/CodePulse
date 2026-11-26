import assert from 'node:assert/strict';
import test from 'node:test';

class OomProtectorService {
  constructor() {
    this.oomScores = new Map();
    this.oomHistory = [];
  }

  adjustOomScore(pid, score) {
    const clamped = Math.max(-1000, Math.min(1000, score));
    this.oomScores.set(pid, clamped);
    return true;
  }

  monitorMemoryPressure(cgroupPath, currentBytes, limitBytes) {
    const ratio = limitBytes > 0 ? currentBytes / limitBytes : 0;
    return {
      cgroupPath,
      usageBytes: currentBytes,
      limitBytes,
      pressureRatio: parseFloat(ratio.toFixed(4)),
      isCritical: ratio >= 0.90
    };
  }

  triggerPreemptiveEviction(podId) {
    return { evicted: true, reclaimedBytes: 128 * 1024 * 1024 };
  }

  recordOomEvent(details) {
    const event = { id: `oom-${Date.now()}`, ...details, timestamp: new Date().toISOString() };
    this.oomHistory.push(event);
    return event;
  }

  getOomProtectionMetrics() {
    return { totalOomEvents: this.oomHistory.length, protectedPidsCount: this.oomScores.size };
  }
}

test('OomProtectorService: monitors memory pressure and records OOM events', () => {
  const protector = new OomProtectorService();
  protector.adjustOomScore(5001, 1000); // Max score for untrusted sandbox

  const pressure = protector.monitorMemoryPressure('/sys/fs/cgroup/sandbox1', 95 * 1024 * 1024, 100 * 1024 * 1024);
  assert.equal(pressure.isCritical, true);

  const oom = protector.recordOomEvent({
    pid: 5001,
    cgroup: '/sys/fs/cgroup/sandbox1',
    memoryRequested: 105 * 1024 * 1024,
    memoryLimit: 100 * 1024 * 1024
  });
  assert.equal(oom.pid, 5001);
  assert.equal(protector.getOomProtectionMetrics().totalOomEvents, 1);
});
