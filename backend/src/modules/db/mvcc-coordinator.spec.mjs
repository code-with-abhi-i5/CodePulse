import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MvccCoordinatorService {
  constructor() {
    this.entityVersions = new Map();
  }

  getVersion(entityId) {
    return this.entityVersions.get(entityId) || 1;
  }

  verifyAndUpdate(entityId, expectedVersion, payload) {
    const current = this.getVersion(entityId);
    if (expectedVersion !== current) {
      return { success: false, newVersion: current };
    }
    const next = current + 1;
    this.entityVersions.set(entityId, next);
    return { success: true, newVersion: next };
  }
}

describe('MvccCoordinatorService', () => {
  it('enforces optimistic concurrency control preventing update anomalies', () => {
    const service = new MvccCoordinatorService();
    const update1 = service.verifyAndUpdate('profile-99', 1, { theme: 'dark' });
    assert.equal(update1.success, true);
    assert.equal(update1.newVersion, 2);

    const staleUpdate = service.verifyAndUpdate('profile-99', 1, { theme: 'light' });
    assert.equal(staleUpdate.success, false);
    assert.equal(staleUpdate.newVersion, 2);
  });
});
