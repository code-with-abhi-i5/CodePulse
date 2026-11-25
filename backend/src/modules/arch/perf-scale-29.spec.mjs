import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SandboxStartupAcceleratorService } from './perf-scale-29.service.ts';

describe('SandboxStartupAcceleratorService (PERF-SCALE-29)', () => {
  it('serves pre-warmed sandbox with zero cold start delay', () => {
    const accelerator = new SandboxStartupAcceleratorService(3);
    accelerator.prewarm('python3', 2);
    assert.strictEqual(accelerator.getWarmCount('python3'), 2);

    const acquired = accelerator.acquireSandbox('python3');
    assert.strictEqual(acquired.isWarm, true);
    assert.strictEqual(acquired.sandbox.runtime, 'python3');
  });

  it('falls back to cold start when warm pool is depleted', () => {
    const accelerator = new SandboxStartupAcceleratorService();
    const acquired = accelerator.acquireSandbox('rust');
    assert.strictEqual(acquired.isWarm, false);
    assert.ok(acquired.sandbox.id.includes('cold'));
  });
});
