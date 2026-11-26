import test from 'node:test';
import assert from 'node:assert/strict';

class CacheWarmupWorker {
  constructor() {
    this.cache = new Map();
    this.isWarmedUp = false;
  }

  async warmup(challenges, concurrencyLimit = 25) {
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

  getChallenge(key) {
    return this.cache.get(key) || null;
  }

  isReady() {
    return this.isWarmedUp;
  }

  clear() {
    this.cache.clear();
    this.isWarmedUp = false;
  }
}

test('CacheWarmupWorker - preloads top challenge definitions with concurrency control', async () => {
  const worker = new CacheWarmupWorker();
  const challenges = Array.from({ length: 30 }, (_, i) => ({
    id: `chal-${i}`,
    slug: `challenge-slug-${i}`,
    title: `Challenge ${i}`,
    difficulty: 'medium',
    popularityScore: 100 - i,
    testHarnessCode: 'assert(true);'
  }));

  const progress = await worker.warmup(challenges, 10);
  assert.strictEqual(progress.totalChallenges, 30);
  assert.strictEqual(progress.loadedChallenges, 30);
  assert.strictEqual(worker.isReady(), true);

  const item = worker.getChallenge('chal-0');
  assert.strictEqual(item?.title, 'Challenge 0');

  const badProgress = await worker.warmup([{ id: '', slug: '', title: 'bad' }]);
  assert.strictEqual(badProgress.failedChallenges, 1);
});
