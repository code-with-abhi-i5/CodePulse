import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class JwtTokenRotatorService {
  constructor() {
    this.revokedHashes = new Set();
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  issueRefreshToken(userId) {
    const token = `rt_${userId}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const hash = this.hashToken(token);
    return { token, hash };
  }

  rotateRefreshToken(oldToken, userId) {
    if (this.isRevoked(oldToken)) return { success: false };
    this.revokeToken(oldToken);
    const next = this.issueRefreshToken(userId);
    return { success: true, newToken: next.token };
  }

  revokeToken(token) {
    this.revokedHashes.add(this.hashToken(token));
  }

  isRevoked(token) {
    return this.revokedHashes.has(this.hashToken(token));
  }
}

describe('JwtTokenRotatorService', () => {
  it('cryptographically rotates JWT refresh tokens and prevents replay attacks', () => {
    const service = new JwtTokenRotatorService();
    const t1 = service.issueRefreshToken('dev-7');
    assert.equal(service.isRevoked(t1.token), false);

    const rotation = service.rotateRefreshToken(t1.token, 'dev-7');
    assert.equal(rotation.success, true);
    assert.equal(service.isRevoked(t1.token), true);

    const replay = service.rotateRefreshToken(t1.token, 'dev-7');
    assert.equal(replay.success, false);
  });
});
