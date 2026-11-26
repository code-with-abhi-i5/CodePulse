import assert from 'node:assert/strict';
import test from 'node:test';

class ModelFallbackService {
  selectModel(health) {
    if (!health.primaryUp || health.latencyP99Ms > 4000) {
      return { modelName: 'llama3:8b-instruct', provider: 'local-llama3', isFallback: true };
    }
    return { modelName: 'claude-3-5-sonnet', provider: 'anthropic', isFallback: false };
  }
}

test('ModelFallbackService: automatically shifts traffic to local LLaMA3 upon cloud latency spikes', () => {
  const router = new ModelFallbackService();
  const normal = router.selectModel({ primaryUp: true, latencyP99Ms: 450 });
  assert.equal(normal.isFallback, false);
  assert.equal(normal.provider, 'anthropic');

  const degraded = router.selectModel({ primaryUp: true, latencyP99Ms: 4500 });
  assert.equal(degraded.isFallback, true);
  assert.equal(degraded.provider, 'local-llama3');
});
