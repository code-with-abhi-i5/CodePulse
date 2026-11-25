import { Injectable, Logger } from '@nestjs/common';
import { TokenUsageBucket } from '../../../src/types/ai';

@Injectable()
export class TokenRateLimitService {
  private readonly logger = new Logger(TokenRateLimitService.name);
  private userBuckets: Map<string, TokenUsageBucket> = new Map();

  public checkAndConsume(userId: string, tokensRequested: number, tier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'): { allowed: boolean; remaining: number } {
    let bucket = this.userBuckets.get(userId);
    if (!bucket) {
      const maxTokens = tier === 'ENTERPRISE' ? 1000000 : tier === 'PRO' ? 250000 : 50000;
      bucket = {
        userId,
        tier,
        promptTokens: 0,
        completionTokens: 0,
        remainingTokens: maxTokens
      };
      this.userBuckets.set(userId, bucket);
    }

    if (bucket.remainingTokens >= tokensRequested) {
      bucket.remainingTokens -= tokensRequested;
      bucket.promptTokens += tokensRequested;
      return { allowed: true, remaining: bucket.remainingTokens };
    }

    return { allowed: false, remaining: bucket.remainingTokens };
  }

  public recordCompletion(userId: string, completionTokens: number): void {
    const bucket = this.userBuckets.get(userId);
    if (bucket) {
      bucket.completionTokens += completionTokens;
    }
  }

  public getBucket(userId: string): TokenUsageBucket | null {
    return this.userBuckets.get(userId) || null;
  }
}
