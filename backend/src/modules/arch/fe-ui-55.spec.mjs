import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrontendFeatureFlagService } from './fe-ui-55.service.ts';

describe('FrontendFeatureFlagService (FE-UI-55)', () => {
  it('evaluates static feature flags', () => {
    const service = new FrontendFeatureFlagService();
    service.registerFlag({ key: 'monaco-vim', enabled: true });
    service.registerFlag({ key: 'beta-compiler', enabled: false });

    assert.strictEqual(service.evaluate('monaco-vim'), true);
    assert.strictEqual(service.evaluate('beta-compiler'), false);
    assert.strictEqual(service.evaluate('unknown-flag'), false);
  });

  it('evaluates deterministic rollout percentage based on userId', () => {
    const service = new FrontendFeatureFlagService();
    service.registerFlag({ key: 'new-profile-page', enabled: true, rolloutPercentage: 50 });

    const res1 = service.evaluate('new-profile-page', 'user-100');
    const res2 = service.evaluate('new-profile-page', 'user-100');
    assert.strictEqual(res1, res2); // Deterministic
  });
});
