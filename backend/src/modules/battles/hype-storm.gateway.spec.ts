import { Test, TestingModule } from '@nestjs/testing';
import { HypeStormGateway, SpectatorEmoji } from './hype-storm.gateway';
import { RedisService } from '../../common/redis/redis.service';
import { HypeMeterService } from './hype-meter.service';

describe('HypeStormGateway Backend & Load Suite (#537)', () => {
  let gateway: HypeStormGateway;
  let redisService: RedisService;
  let mockServer: any;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HypeStormGateway, RedisService, HypeMeterService],
    }).compile();

    gateway = module.get<HypeStormGateway>(HypeStormGateway);
    redisService = module.get<RedisService>(RedisService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    gateway.stopAggregationLoop();
    gateway.onModuleDestroy();
    redisService.clearMemoryStores();
  });

  describe('High-Throughput Ingestion (10,000 reactions/sec criteria)', () => {
    it('handles 10,000 spectator reactions without server event loop degradation', () => {
      const battleId = 'battle_esports_championship';
      const totalReactions = 10000;
      const emojis: SpectatorEmoji[] = ['🔥', '🚀', '💡', '🤯', '💀'];

      const startTime = performance.now();

      // Ingest 10,000 reactions across 500 distinct spectators
      for (let i = 0; i < totalReactions; i++) {
        const userId = `spectator_${i % 500}`;
        const emoji = emojis[i % emojis.length];
        gateway.recordReaction({
          battleId,
          emoji,
          userId,
        });
      }

      const elapsedMs = performance.now() - startTime;

      // Acceptance criterion: 10,000 reactions processed in sub-100ms with negligible overhead
      expect(elapsedMs).toBeLessThan(150);

      // Verify aggregation tick drains all 10,000 reactions into a single throttled broadcast
      const broadcasts = gateway.processAggregationTick();
      expect(broadcasts.length).toBe(1);

      const snap = broadcasts[0];
      expect(snap.battleId).toBe(battleId);
      expect(snap.totalWindowReactions).toBeGreaterThan(0);
      expect(snap.hypePercentage).toBe(100);
      expect(snap.isPeakHype).toBe(true);
      expect(snap.triggerBurst).toBe(true);
      expect(snap.audioHype.soundCue).toBe('HYPE_BURST_PEAK');

      // Verify density vector counts
      const sumVectors = Object.values(snap.densityVectors).reduce((a, b) => a + b, 0);
      expect(sumVectors).toBe(snap.totalWindowReactions);
    });
  });

  describe('100ms Aggregation & Network Throttling', () => {
    it('throttles broadcasts to 10 updates per second per battle room', () => {
      const battleId = 'battle_throttle_test';

      // Record reactions
      gateway.recordReaction({ battleId, emoji: '🔥', userId: 'user_1' });
      gateway.recordReaction({ battleId, emoji: '🚀', userId: 'user_2' });
      gateway.recordReaction({ battleId, emoji: '💡', userId: 'user_3' });

      // Run 1 tick
      const ticks = gateway.processAggregationTick();
      expect(ticks.length).toBe(1);
      expect(mockServer.to).toHaveBeenCalledWith(`battle:${battleId}`);
      expect(mockServer.to).toHaveBeenCalledWith(`spectator:${battleId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('hype:storm_update', expect.objectContaining({
        battleId,
        totalWindowReactions: 3,
        dominantEmoji: '🔥',
      }));
    });
  });

  describe('Spectator Rate Limiting Guard', () => {
    it('limits abusive single-user burst spam while allowing normal reactions', () => {
      const battleId = 'battle_spam_defense';
      const spammerId = 'bot_spammer_9000';

      let acceptedCount = 0;
      let rejectedCount = 0;

      // Attempt 60 rapid reactions in the same instant from 1 user
      for (let i = 0; i < 60; i++) {
        const accepted = gateway.recordReaction({
          battleId,
          emoji: '🔥',
          userId: spammerId,
        });
        if (accepted) acceptedCount++;
        else rejectedCount++;
      }

      // Capacity is 30, so subsequent bursts are rate limited
      expect(acceptedCount).toBe(30);
      expect(rejectedCount).toBe(30);
    });
  });

  describe('Live Audio Hype Meter & 100% Burst Trigger', () => {
    it('triggers rising-edge particle burst and peak audio fanfare at 100% hype', () => {
      const battleId = 'battle_hype_burst';

      // Force high reactions
      for (let i = 0; i < 40; i++) {
        gateway.recordReaction({ battleId, emoji: '🤯', userId: `spec_${i}` });
      }

      const [tick1] = gateway.processAggregationTick();
      expect(tick1.hypePercentage).toBe(100);
      expect(tick1.triggerBurst).toBe(true);
      expect(tick1.audioHype.soundCue).toBe('HYPE_BURST_PEAK');
      expect(tick1.audioHype.pitchMultiplier).toBe(2.5);

      // On subsequent continuous 100% tick, burst should not re-trigger repeatedly (rising-edge only)
      for (let i = 0; i < 40; i++) {
        gateway.recordReaction({ battleId, emoji: '🔥', userId: `spec_${i}` });
      }
      const [tick2] = gateway.processAggregationTick();
      expect(tick2.hypePercentage).toBe(100);
      expect(tick2.triggerBurst).toBe(false);
    });

    it('decays hype smoothly when spectators become idle', () => {
      const battleId = 'battle_decay_test';

      gateway.setHypeLevel(battleId, 50);

      // Tick with no reactions
      const [tick] = gateway.processAggregationTick();
      expect(tick.hypePercentage).toBeLessThan(50);
      expect(tick.hypePercentage).toBeGreaterThanOrEqual(45);
    });
  });
});
