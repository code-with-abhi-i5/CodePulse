import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { LspLanguage, LspSession } from './lsp-cluster.types';

@Injectable()
export class LspClusterService implements OnModuleDestroy {
  private readonly logger = new Logger(LspClusterService.name);
  private readonly sessions = new Map<string, LspSession>();
  private readonly idleTimeoutMs = 60000; // 1 minute

  public onModuleDestroy(): void {
    this.sessions.clear();
  }

  public getOrCreateSession(sessionId: string, language: LspLanguage): LspSession {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        language,
        isSleeping: false,
        lastActiveTimestamp: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.isSleeping = false;
      session.lastActiveTimestamp = Date.now();
    }
    return session;
  }

  public reapIdleSessions(): number {
    const now = Date.now();
    let reaped = 0;
    for (const session of this.sessions.values()) {
      if (!session.isSleeping && now - session.lastActiveTimestamp > this.idleTimeoutMs) {
        session.isSleeping = true;
        reaped++;
      }
    }
    return reaped;
  }
}
