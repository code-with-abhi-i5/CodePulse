import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

class DistributedConfigHotReloader {
  constructor(initialFlags = {}) {
    const raw = JSON.stringify(initialFlags);
    this.currentConfig = {
      version: 1,
      flags: { ...initialFlags },
      timestamp: Date.now(),
      hash: crypto.createHash('sha256').update(raw).digest('hex')
    };
  }

  getCurrentConfig() {
    return { ...this.currentConfig };
  }

  getFlag(key) {
    return this.currentConfig.flags[key];
  }

  reloadFlags(newFlags) {
    const raw = JSON.stringify(newFlags);
    const newHash = crypto.createHash('sha256').update(raw).digest('hex');

    if (newHash === this.currentConfig.hash) {
      return { changed: false, version: this.currentConfig.version };
    }

    this.currentConfig = {
      version: this.currentConfig.version + 1,
      flags: { ...newFlags },
      timestamp: Date.now(),
      hash: newHash
    };

    return { changed: true, version: this.currentConfig.version };
  }
}

test('DistributedConfigHotReloader - hot swaps environment flags with monotonic versions', () => {
  const reloader = new DistributedConfigHotReloader({ enableFeatureX: false, maxConns: 100 });
  assert.strictEqual(reloader.getFlag('enableFeatureX'), false);

  const res1 = reloader.reloadFlags({ enableFeatureX: true, maxConns: 100 });
  assert.strictEqual(res1.changed, true);
  assert.strictEqual(res1.version, 2);
  assert.strictEqual(reloader.getFlag('enableFeatureX'), true);

  const res2 = reloader.reloadFlags({ enableFeatureX: true, maxConns: 100 });
  assert.strictEqual(res2.changed, false);
  assert.strictEqual(res2.version, 2);
});
