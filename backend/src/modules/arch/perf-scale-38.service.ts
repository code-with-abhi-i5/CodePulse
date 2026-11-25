/**
 * Architecture Service: Distributed Session Storage Compaction Cleaner
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-38]
 */

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface CompactionReport {
  scanned: number;
  deleted: number;
  retained: number;
  durationMs: number;
}

export class SessionCompactionCleanerService {
  private sessions: Map<string, SessionRecord>;

  constructor() {
    this.sessions = new Map();
  }

  public setSession(token: string, userId: string, ttlMs: number, now: number = Date.now()): void {
    this.sessions.set(token, {
      token,
      userId,
      expiresAt: now + ttlMs
    });
  }

  public getSession(token: string, now: number = Date.now()): SessionRecord | null {
    const s = this.sessions.get(token);
    if (!s || now >= s.expiresAt) return null;
    return s;
  }

  public compactExpiredSessions(batchSize: number = 1000, now: number = Date.now()): CompactionReport {
    const startTime = Date.now();
    let scanned = 0;
    let deleted = 0;

    for (const [token, record] of this.sessions.entries()) {
      if (scanned >= batchSize) break;
      scanned++;

      if (now >= record.expiresAt) {
        this.sessions.delete(token);
        deleted++;
      }
    }

    return {
      scanned,
      deleted,
      retained: this.sessions.size,
      durationMs: Date.now() - startTime
    };
  }

  public size(): number {
    return this.sessions.size;
  }
}
