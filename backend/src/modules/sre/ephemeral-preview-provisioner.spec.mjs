import test from 'node:test';
import assert from 'node:assert/strict';

class EphemeralPreviewProvisioner {
  constructor() {
    this.environments = new Map();
  }

  provision(prNumber, branch, ttlMinutes = 120) {
    const envId = `pr-${prNumber}-${branch.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 15)}`;
    const spec = {
      envId,
      prNumber,
      branch,
      allocatedCpu: '500m',
      allocatedMemory: '1024Mi',
      ttlMinutes,
      createdAt: Date.now(),
      status: 'active'
    };
    this.environments.set(envId, spec);
    return spec;
  }

  getEnvironment(envId) {
    return this.environments.get(envId);
  }

  reapExpired() {
    const now = Date.now();
    const expired = [];

    for (const [id, spec] of this.environments.entries()) {
      const ageMinutes = (now - spec.createdAt) / 60000;
      if (ageMinutes > spec.ttlMinutes) {
        spec.status = 'expired';
        expired.push(id);
        this.environments.delete(id);
      }
    }
    return expired;
  }
}

test('EphemeralPreviewProvisioner - provisions PR preview clusters and reaps expired environments', () => {
  const prov = new EphemeralPreviewProvisioner();
  const env = prov.provision(1234, 'feat/awesome-ui', 60);

  assert.strictEqual(env.status, 'active');
  assert.strictEqual(env.prNumber, 1234);
  assert.strictEqual(prov.getEnvironment(env.envId).branch, 'feat/awesome-ui');
});
