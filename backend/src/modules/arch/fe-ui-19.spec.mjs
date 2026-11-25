import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebGlParticleCelebrationService } from './fe-ui-19.service.ts';

describe('WebGlParticleCelebrationService (FE-UI-19)', () => {
  it('simulates particle physics and outputs packed Float32Array buffer for GPU instanced rendering', () => {
    const system = new WebGlParticleCelebrationService(50, 0.5);
    assert.strictEqual(system.getParticleCount(), 50);

    const buf = system.stepPhysics(1);
    assert.strictEqual(buf.length, 50 * 4); // 4 floats per particle
    assert.ok(buf[2] <= 1.0); // alpha <= 1.0
  });
});
