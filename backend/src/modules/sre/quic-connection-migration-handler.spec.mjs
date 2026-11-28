import test from 'node:test';
import assert from 'node:assert/strict';

class QuicConnectionMigrationHandler {
  constructor() {
    this.sessions = new Map();
  }

  registerSession(session) {
    this.sessions.set(session.connectionId, {
      ...session,
      lastActiveAt: Date.now(),
      pathValidated: true
    });
  }

  initiateMigration(connectionId, newIp, newPort) {
    const session = this.sessions.get(connectionId);
    if (!session) {
      throw new Error(`Session ${connectionId} not found`);
    }

    const nonce = 'simulated-nonce-16bytes';
    session.pathChallengeNonce = nonce;
    return nonce;
  }

  validateAndMigrate(connectionId, newIp, newPort, responseNonce) {
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

  getSession(connectionId) {
    return this.sessions.get(connectionId) || null;
  }
}

test('QuicConnectionMigrationHandler - handles seamless IP roaming via path challenge validation', () => {
  const handler = new QuicConnectionMigrationHandler();
  handler.registerSession({
    connectionId: 'conn-quic-99',
    userId: 'user-42',
    clientIp: '198.51.100.1',
    clientPort: 45000,
    pathValidated: true,
    lastActiveAt: Date.now()
  });

  const nonce = handler.initiateMigration('conn-quic-99', '203.0.113.88', 51200);
  assert.ok(nonce.length > 0);

  const res = handler.validateAndMigrate('conn-quic-99', '203.0.113.88', 51200, nonce);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.oldIp, '198.51.100.1');
  assert.strictEqual(res.newIp, '203.0.113.88');
  assert.strictEqual(res.pathValidated, true);

  const badRes = handler.validateAndMigrate('conn-quic-99', '203.0.113.99', 51200, 'invalid-token');
  assert.strictEqual(badRes.success, false);
});
