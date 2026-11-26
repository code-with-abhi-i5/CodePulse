import assert from 'node:assert/strict';
import test from 'node:test';

class PtraceJailService {
  constructor() {
    this.profiles = new Map();
    this.auditLogs = [];
    this.profiles.set('default-safe', new Set([
      'read', 'write', 'openat', 'close', 'fstat', 'mmap', 'exit_group'
    ]));
  }

  buildSeccompBpfProfile(profileId, allowedSyscalls) {
    const set = new Set(allowedSyscalls);
    this.profiles.set(profileId, set);
    return { profileId, rulesCount: set.size };
  }

  interceptSyscall(pid, syscallName, profileId = 'default-safe') {
    const allowed = this.profiles.get(profileId) || this.profiles.get('default-safe');
    if (allowed.has(syscallName)) {
      return { allowed: true, action: 'ALLOW' };
    }
    const violation = this.handleSecurityViolation(pid, syscallName);
    return { allowed: false, action: violation.actionTaken };
  }

  handleSecurityViolation(pid, syscallName) {
    const event = {
      violationId: `viol-${Date.now()}`,
      pid,
      syscallName,
      timestamp: new Date().toISOString(),
      actionTaken: 'KILL'
    };
    this.auditLogs.push(event);
    return event;
  }

  getAuditLog() {
    return [...this.auditLogs];
  }
}

test('PtraceJailService: permits safe syscalls and blocks dangerous socket/fork', () => {
  const jail = new PtraceJailService();
  const safeCheck = jail.interceptSyscall(1234, 'read');
  assert.equal(safeCheck.allowed, true);
  assert.equal(safeCheck.action, 'ALLOW');

  const blockedSocket = jail.interceptSyscall(1234, 'socket');
  assert.equal(blockedSocket.allowed, false);
  assert.equal(blockedSocket.action, 'KILL');

  const logs = jail.getAuditLog();
  assert.equal(logs.length, 1);
  assert.equal(logs[0].syscallName, 'socket');
});
