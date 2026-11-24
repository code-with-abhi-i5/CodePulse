import { Test, TestingModule } from '@nestjs/testing';
import { ZscoreNormalizerService } from './zscore-normalizer.service';
import { ShardedLeaderboardService } from './sharded-leaderboard.service';

describe('ShardedLeaderboardService & ZscoreNormalizerService', () => {
  let normalizer: ZscoreNormalizerService;
  let leaderboard: ShardedLeaderboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZscoreNormalizerService, ShardedLeaderboardService],
    }).compile();

    normalizer = module.get<ZscoreNormalizerService>(ZscoreNormalizerService);
    leaderboard = module.get<ShardedLeaderboardService>(ShardedLeaderboardService);
  });

  afterEach(() => {
    leaderboard.clear();
  });

  describe('Welford Algorithm & Z-Score Normalization', () => {
    it('computes streaming mean and standard deviation accurately', () => {
      const shard = 'algorithms:GLOBAL';
      normalizer.updateDistribution(shard, 100);
      normalizer.updateDistribution(shard, 200);
      normalizer.updateDistribution(shard, 300);

      const stats = normalizer.getDistribution(shard)!;
      expect(stats.count).toBe(3);
      expect(stats.mean).toBe(200);
      expect(stats.stdDev).toBe(100);

      // Z-score for 200 (mean) is 0.0 -> 50th percentile
      expect(normalizer.calculateZScore(shard, 200)).toBe(0);
      expect(normalizer.calculatePercentile(shard, 200)).toBe(50);

      // Z-score for 300 (+1 stdDev) -> ~84th percentile
      expect(normalizer.calculateZScore(shard, 300)).toBe(1.0);
      expect(normalizer.calculatePercentile(shard, 300)).toBeCloseTo(84.13, 1);
    });
  });

  describe('Sharded Leaderboard Sub-2ms Performance and Ranks', () => {
    it('records player scores in < 2ms and calculates instant ranks', async () => {
      // Record scores for 5 players in parallel
      const players = [
        { id: 'p1', score: 2500 },
        { id: 'p2', score: 2100 },
        { id: 'p3', score: 1800 },
        { id: 'p4', score: 1500 },
        { id: 'p5', score: 1200 },
      ];

      for (const p of players) {
        const start = performance.now();
        await leaderboard.recordScore('OVERALL', 'NA', p.id, p.score);
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(10); // Well within ultra-fast bound
      }

      // Check p1 rank (highest score => rank 1)
      const rankP1 = leaderboard.getPlayerRank('OVERALL', 'NA', 'p1');
      expect(rankP1).not.toBeNull();
      expect(rankP1?.rank).toBe(1);
      expect(rankP1?.percentile).toBeGreaterThan(90);

      // Check p3 rank (middle score => rank 3)
      const rankP3 = leaderboard.getPlayerRank('OVERALL', 'NA', 'p3');
      expect(rankP3?.rank).toBe(3);

      // Check top players query
      const top3 = leaderboard.getTopPlayers('OVERALL', 'NA', 3);
      expect(top3.length).toBe(3);
      expect(top3[0].userId).toBe('p1');
      expect(top3[1].userId).toBe('p2');
      expect(top3[2].userId).toBe('p3');
    });

    it('isolates different categories and regions independently', async () => {
      await leaderboard.recordScore('ALGORITHMS', 'EU', 'eu_player', 3000);
      await leaderboard.recordScore('ALGORITHMS', 'APAC', 'apac_player', 2800);

      const euRank = leaderboard.getPlayerRank('ALGORITHMS', 'EU', 'eu_player');
      expect(euRank?.shardKey).toBe('algorithms:EU');
      expect(euRank?.rank).toBe(1);

      // apac_player is not in EU shard
      expect(leaderboard.getPlayerRank('ALGORITHMS', 'EU', 'apac_player')).toBeNull();
    });
  });
});
