/**
 * Architecture Service: Session Fixation Guard with Cookie Rotation
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-38]
 */

import crypto from 'node:crypto';

export class SessionFixationGuardService {
  private sessionStore: Map<string, { userId: string; role: string }>;

  constructor() {
    this.sessionStore = new Map();
  }

  public createSession(userId: string, role: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    this.sessionStore.set(sessionId, { userId, role });
    return sessionId;
  }

  public elevatePrivilege(oldSessionId: string, newRole: string): string {
    const existing = this.sessionStore.get(oldSessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    // Invalidate old session ID immediately
    this.sessionStore.delete(oldSessionId);

    // Issue brand-new cryptographic session ID
    const newSessionId = crypto.randomBytes(32).toString('hex');
    this.sessionStore.set(newSessionId, { userId: existing.userId, role: newRole });
    return newSessionId;
  }

  public getSession(sessionId: string): { userId: string; role: string } | null {
    return this.sessionStore.get(sessionId) || null;
  }
}
