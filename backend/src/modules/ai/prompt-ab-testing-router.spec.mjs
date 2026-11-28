import test from 'node:test';
import assert from 'node:assert/strict';

class PromptAbTestingRouter {
  constructor(variants) {
    this.variants = variants;
  }

  routeRequest(userId) {
    if (this.variants.length === 0) throw new Error('No variants configured');
    const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const index = hash % this.variants.length;
    return this.variants[index];
  }

  recordResult(variantId, modelName, passed, latencyMs) {
    return {
      selectedVariantId: variantId,
      modelName,
      completionPassed: passed,
      latencyMs
    };
  }
}

test('PromptAbTestingRouter - routes user deterministically to A/B prompt variants', () => {
  const variants = [
    { variantId: 'vA', modelName: 'claude-3-5-sonnet', systemPrompt: 'Be brief.', trafficWeight: 50 },
    { variantId: 'vB', modelName: 'gpt-4o', systemPrompt: 'Be detailed.', trafficWeight: 50 }
  ];
  const router = new PromptAbTestingRouter(variants);

  const assigned = router.routeRequest('user-42');
  assert.ok(['vA', 'vB'].includes(assigned.variantId));

  const evalRes = router.recordResult(assigned.variantId, assigned.modelName, true, 250);
  assert.strictEqual(evalRes.completionPassed, true);
  assert.strictEqual(evalRes.latencyMs, 250);
});
