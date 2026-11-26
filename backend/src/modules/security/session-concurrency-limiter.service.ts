import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionConcurrencyLimiterService {
  private readonly userSessions: Map<string, string[]> = new Map();

  registerSession(userId: string, sessionId: string, maxSessions: number = 3): { kickedSessionId?: string } {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, []);
    }
    const sessions = this.userSessions.get(userId)!;
    let kickedSessionId: string | undefined;

    if (sessions.length >= maxSessions) {
      kickedSessionId = sessions.shift();
    }
    sessions.push(sessionId);
    return { kickedSessionId };
  }

  getActiveSessions(userId: string): string[] {
    return this.userSessions.get(userId) || [];
  }

  revokeSession(userId: string, sessionId: string): boolean {
    const sessions = this.userSessions.get(userId);
    if (!sessions) return false;
    const idx = sessions.indexOf(sessionId);
    if (idx !== -1) {
      sessions.splice(idx, 1);
      return true;
    }
    return false;
  }
}
