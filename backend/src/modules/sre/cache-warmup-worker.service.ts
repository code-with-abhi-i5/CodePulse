import { ChallengeDefinition, WarmupProgress } from '../../types/sre';

export class CacheWarmupWorker {
  private cache: Map<string, ChallengeDefinition> = new Map();
  private isWarmedUp: boolean = false;

  async warmup(challenges: ChallengeDefinition[], concurrencyLimit: number = 25): Promise<WarmupProgress> {
    const startTime = Date.now();
    let loaded = 0;
    let failed = 0;

    for (let i = 0; i < challenges.length; i += concurrencyLimit) {
      const batch = challenges.slice(i, i + concurrencyLimit);
      await Promise.all(
        batch.map(async item => {
          try {
            if (!item.id || !item.slug) {
              throw new Error('Invalid challenge definition');
            }
            this.cache.set(item.id, item);
            this.cache.set(item.slug, item);
            loaded++;
          } catch {
            failed++;
          }
        })
      );
    }

    this.isWarmedUp = loaded > 0;
    return {
      totalChallenges: challenges.length,
      loadedChallenges: loaded,
      failedChallenges: failed,
      durationMs: Date.now() - startTime,
      isComplete: true
    };
  }

  getChallenge(key: string): ChallengeDefinition | null {
    return this.cache.get(key) || null;
  }

  isReady(): boolean {
    return this.isWarmedUp;
  }

  clear(): void {
    this.cache.clear();
    this.isWarmedUp = false;
  }
}
