import { Injectable, Logger } from '@nestjs/common';
import { SecurityViolationEvent } from '../../../src/types/backend';

@Injectable()
export class PtraceJailService {
  private readonly logger = new Logger(PtraceJailService.name);
  private profiles: Map<string, Set<string>> = new Map();
  private auditLogs: SecurityViolationEvent[] = [];

  constructor() {
    // Default safe profile
    this.profiles.set('default-safe', new Set([
      'read', 'write', 'openat', 'close', 'fstat', 'mmap', 'mprotect', 'munmap',
      'brk', 'rt_sigaction', 'exit_group', 'arch_prctl'
    ]));
  }

  public buildSeccompBpfProfile(profileId: string, allowedSyscalls: string[]) {
    const set = new Set(allowedSyscalls);
    this.profiles.set(profileId, set);
    return {
      profileId,
      rulesCount: set.size
    };
  }

  public interceptSyscall(pid: number, syscallName: string, profileId = 'default-safe') {
    const allowed = this.profiles.get(profileId) ?? this.profiles.get('default-safe')!;
    if (allowed.has(syscallName)) {
      return { allowed: true, action: 'ALLOW' as const };
    }
    const violation = this.handleSecurityViolation(pid, syscallName);
    return { allowed: false, action: violation.actionTaken };
  }

  public handleSecurityViolation(pid: number, syscallName: string): SecurityViolationEvent {
    const event: SecurityViolationEvent = {
      violationId: `viol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pid,
      syscallName,
      timestamp: new Date().toISOString(),
      actionTaken: 'KILL'
    };
    this.auditLogs.push(event);
    return event;
  }

  public getAuditLog(): SecurityViolationEvent[] {
    return [...this.auditLogs];
  }
}
