import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class JwtKeyRotationManagerService {
  constructor() {
    this.activeKeyId = 'key-v1';
    this.validKeyIds = new Set(['key-v1']);
    this.revokedKeyIds = new Set();
  }

  rotateKey(newKeyId) {
    this.validKeyIds.add(newKeyId);
    this.activeKeyId = newKeyId;
    return this.getState();
  }

  revokeKey(keyId) {
    this.validKeyIds.delete(keyId);
    this.revokedKeyIds.add(keyId);
    return this.getState();
  }

  isKeyValid(keyId) {
    return this.validKeyIds.has(keyId) && !this.revokedKeyIds.has(keyId);
  }

  getState() {
    return {
      activeKeyId: this.activeKeyId,
      validKeyIds: Array.from(this.validKeyIds),
      revokedKeyIds: Array.from(this.revokedKeyIds)
    };
  }
}

describe('JwtKeyRotationManagerService', () => {
  const manager = new JwtKeyRotationManagerService();

  it('rotates signing keys maintaining validity of prior keys', () => {
    assert.equal(manager.getState().activeKeyId, 'key-v1');

    manager.rotateKey('key-v2');
    assert.equal(manager.getState().activeKeyId, 'key-v2');
    assert.equal(manager.isKeyValid('key-v1'), true);
    assert.equal(manager.isKeyValid('key-v2'), true);
  });

  it('revokes compromised keys instantly', () => {
    manager.revokeKey('key-v1');
    assert.equal(manager.isKeyValid('key-v1'), false);
  });
});
