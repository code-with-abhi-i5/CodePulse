import { TlsSessionData } from '../../types/sre';

export class SslSessionResumptionCache {
  private cache: Map<string, TlsSessionData> = new Map();
  private defaultTtlSeconds: number;

  constructor(defaultTtlSeconds: number = 3600) {
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  storeSession(sessionId: string, ticket: string, peerIdentity?: string): TlsSessionData {
    const session: TlsSessionData = {
      sessionId,
      ticket,
      peerIdentity,
      createdAt: Date.now(),
      ttlSeconds: this.defaultTtlSeconds
    };
    this.cache.set(sessionId, session);
    return session;
  }

  resumeSession(sessionId: string): TlsSessionData | null {
    const session = this.cache.get(sessionId);
    if (!session) return null;

    const ageSeconds = (Date.now() - session.createdAt) / 1000;
    if (ageSeconds > session.ttlSeconds) {
      this.cache.delete(sessionId);
      return null;
    }
    return session;
  }

  invalidate(sessionId: string): boolean {
    return this.cache.delete(sessionId);
  }
}
