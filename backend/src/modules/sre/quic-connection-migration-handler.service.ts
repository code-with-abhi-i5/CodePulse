import { QuicSession, MigrationResult } from '../../types/sre';
import crypto from 'crypto';

export class QuicConnectionMigrationHandler {
  private sessions: Map<string, QuicSession> = new Map();

  registerSession(session: QuicSession): void {
    this.sessions.set(session.connectionId, {
      ...session,
      lastActiveAt: Date.now(),
      pathValidated: true
    });
  }

  initiateMigration(connectionId: string, newIp: string, newPort: number): string {
    const session = this.sessions.get(connectionId);
    if (!session) {
      throw new Error(`Session ${connectionId} not found`);
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    session.pathChallengeNonce = nonce;
    return nonce;
  }

  validateAndMigrate(
    connectionId: string,
    newIp: string,
    newPort: number,
    responseNonce: string
  ): MigrationResult {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return {
        success: false,
        connectionId,
        oldIp: '',
        newIp,
        pathValidated: false,
        reason: 'Session does not exist'
      };
    }

    if (!session.pathChallengeNonce || session.pathChallengeNonce !== responseNonce) {
      return {
        success: false,
        connectionId,
        oldIp: session.clientIp,
        newIp,
        pathValidated: false,
        reason: 'Invalid path validation challenge nonce'
      };
    }

    const oldIp = session.clientIp;
    session.clientIp = newIp;
    session.clientPort = newPort;
    session.pathValidated = true;
    session.pathChallengeNonce = undefined;
    session.lastActiveAt = Date.now();

    return {
      success: true,
      connectionId,
      oldIp,
      newIp,
      pathValidated: true
    };
  }

  getSession(connectionId: string): QuicSession | null {
    return this.sessions.get(connectionId) || null;
  }
}
