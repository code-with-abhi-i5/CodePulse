import { RedisService } from './redis.service';

describe('RedisService HyperLogLog & Sorted Sets Suite', () => {
  let service: RedisService;

  beforeEach(() => {
    service = new RedisService();
    service.clearMemoryStores();
  });

  afterEach(() => {
    service.clearMemoryStores();
  });

  describe('HyperLogLog (pfAdd & pfCount)', () => {
    it('accurately estimates unique cardinality without duplicates', async () => {
      const key = 'hll:test:spectators';

      // Add unique users
      await service.pfAdd(key, 'user_1', 'user_2', 'user_3');
      expect(await service.pfCount(key)).toBe(3);

      // Add overlapping users
      await service.pfAdd(key, 'user_2', 'user_3', 'user_4');
      expect(await service.pfCount(key)).toBe(4);

      // Union count across multiple keys
      const key2 = 'hll:test:spectators_2';
      await service.pfAdd(key2, 'user_4', 'user_5', 'user_6');
      expect(await service.pfCount(key, key2)).toBe(6);
    });
  });

  describe('Sorted Sets (zAdd, zRangeByScore, zRemRangeByScore)', () => {
    it('manages timestamp-scored entries and range queries', async () => {
      const key = 'zset:test:reactions';
      const now = Date.now();

      await service.zAdd(key, now - 500, 'rx_old');
      await service.zAdd(key, now - 50, 'rx_recent');
      await service.zAdd(key, now, 'rx_now');

      expect(await service.zCard(key)).toBe(3);
      expect(await service.zCount(key, now - 100, now)).toBe(2);

      const recent = await service.zRangeByScore(key, now - 100, now);
      expect(recent).toEqual(['rx_recent', 'rx_now']);

      // Evict old entries
      const removed = await service.zRemRangeByScore(key, '-inf', now - 100);
      expect(removed).toBe(1);
      expect(await service.zCard(key)).toBe(2);
    });
  });

  describe('batchAddHypeReactions & getHypeStats', () => {
    it('batches reactions and calculates window stats with density vectors', async () => {
      const battleId = 'battle_esports_99';
      const now = Date.now();

      const reactions = [
        { emoji: '🔥', userId: 'user_a', timestamp: now - 30 },
        { emoji: '🔥', userId: 'user_b', timestamp: now - 20 },
        { emoji: '🚀', userId: 'user_a', timestamp: now - 10 },
        { emoji: '💡', userId: 'user_c', timestamp: now },
      ];

      await service.batchAddHypeReactions(battleId, reactions);

      const stats = await service.getHypeStats(battleId, 1000);
      expect(stats.uniqueSpectators).toBe(3); // user_a, user_b, user_c
      expect(stats.windowReactions).toBe(4);
      expect(stats.densityVectors['🔥']).toBe(2);
      expect(stats.densityVectors['🚀']).toBe(1);
      expect(stats.densityVectors['💡']).toBe(1);
    });
  });
});
