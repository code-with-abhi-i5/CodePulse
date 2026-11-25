/**
 * Architecture Service: Admin Emergency Break-Glass Authorization Protocol
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-54]
 */

import crypto from 'node:crypto';

export interface BreakGlassSession {
  sessionId: string;
  targetSystem: string;
  reason: string;
  requestedBy: string;
  approvals: Set<string>;
  threshold: number;
  status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REVOKED';
  expiresAt: number;
  sessionToken?: string;
}

export class AdminBreakGlassProtocolService {
  private sessions: Map<string, BreakGlassSession>;
  private requiredThreshold: number;

  constructor(requiredThreshold: number = 2) {
    this.requiredThreshold = requiredThreshold;
    this.sessions = new Map();
  }

  public initiateBreakGlass(requestedBy: string, targetSystem: string, reason: string): BreakGlassSession {
    const sessionId = 'bg_' + crypto.randomBytes(16).toString('hex');
    const session: BreakGlassSession = {
      sessionId,
      targetSystem,
      reason,
      requestedBy,
      approvals: new Set<string>(),
      threshold: this.requiredThreshold,
      status: 'PENDING',
      expiresAt: Date.now() + 1800000 // 30 min window for approvals
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public approveBreakGlass(sessionId: string, adminId: string): { approved: boolean; session?: BreakGlassSession; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) return { approved: false, error: 'Session not found' };
    if (session.status !== 'PENDING') return { approved: false, error: `Cannot approve session in state ${session.status}` };
    if (session.requestedBy === adminId) {
      return { approved: false, error: 'Requester cannot approve their own break-glass request' };
    }

    session.approvals.add(adminId);
    if (session.approvals.size >= session.threshold) {
      session.status = 'APPROVED';
      session.sessionToken = 'bg_tok_' + crypto.randomBytes(32).toString('hex');
      session.expiresAt = Date.now() + 3600000; // 1-hour active emergency access
      return { approved: true, session };
    }

    return { approved: false, session };
  }

  public validateEmergencyToken(token: string): boolean {
    const now = Date.now();
    for (const s of this.sessions.values()) {
      if (s.sessionToken === token && s.status === 'APPROVED' && now < s.expiresAt) {
        return true;
      }
    }
    return false;
  }
}
