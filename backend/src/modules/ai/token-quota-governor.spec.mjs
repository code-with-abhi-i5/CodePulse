import test from 'node:test';
import assert from 'node:assert/strict';

class TokenQuotaGovernorService {
  constructor() {
    this.tierLimits = { free: 10000, pro: 100000, enterprise: 1000000 };
  }

  checkQuota(userId, tier, usedTokensToday, requestedTokens) {
    const limit = this.tierLimits[tier] || 10000;
    return {
      userId,
      tier,
      dailyLimit: limit,
      tokensUsedToday: usedTokensToday,
      isAllowed: (usedTokensToday + requestedTokens) <= limit
    };
  }
}

test('TokenQuotaGovernorService - enforces tier budgets accurately', () => {
  const service = new TokenQuotaGovernorService();
  const ok = service.checkQuota('u1', 'free', 5000, 2000);
  assert.equal(ok.isAllowed, true);

  const exceeded = service.checkQuota('u2', 'free', 9500, 1000);
  assert.equal(exceeded.isAllowed, false);
});
