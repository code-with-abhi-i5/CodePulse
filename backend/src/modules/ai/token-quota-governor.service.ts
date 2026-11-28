import { TokenQuotaStatus } from '../../types/ai';

export class TokenQuotaGovernorService {
  private readonly tierLimits: Record<string, number> = {
    'free': 10000,
    'pro': 100000,
    'enterprise': 1000000
  };

  checkQuota(userId: string, tier: 'free' | 'pro' | 'enterprise', usedTokensToday: number, requestedTokens: number): TokenQuotaStatus {
    const limit = this.tierLimits[tier] || 10000;
    const isAllowed = (usedTokensToday + requestedTokens) <= limit;

    return {
      userId,
      tier,
      dailyLimit: limit,
      tokensUsedToday: usedTokensToday,
      isAllowed
    };
  }
}
