import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SecretsRotationManagerService {
  constructor() {
    this.rotationState = {
      primarySecret: 'initial-db-secret',
      rotationState: 'STABLE',
      lastRotatedAt: Date.now()
    };
  }

  initiateRotation(newSecret, now = Date.now()) {
    this.rotationState = {
      primarySecret: newSecret,
      standbySecret: this.rotationState.primarySecret,
      rotationState: 'ROTATING',
      lastRotatedAt: now
    };
    return this.rotationState;
  }

  finalizeRotation(now = Date.now()) {
    this.rotationState = {
      primarySecret: this.rotationState.primarySecret,
      rotationState: 'STABLE',
      lastRotatedAt: now
    };
    return this.rotationState;
  }

  isValidSecret(secret) {
    return secret === this.rotationState.primarySecret || secret === this.rotationState.standbySecret;
  }

  getState() {
    return this.rotationState;
  }
}

describe('SecretsRotationManagerService', () => {
  const manager = new SecretsRotationManagerService();

  it('manages zero-downtime dual-secret rotation lifecycle', () => {
    assert.equal(manager.isValidSecret('initial-db-secret'), true);

    manager.initiateRotation('new-rotated-secret');
    assert.equal(manager.getState().rotationState, 'ROTATING');
    // Both active and standby secrets valid during rotation
    assert.equal(manager.isValidSecret('new-rotated-secret'), true);
    assert.equal(manager.isValidSecret('initial-db-secret'), true);

    manager.finalizeRotation();
    assert.equal(manager.getState().rotationState, 'STABLE');
    assert.equal(manager.isValidSecret('new-rotated-secret'), true);
    assert.equal(manager.isValidSecret('initial-db-secret'), false);
  });
});
