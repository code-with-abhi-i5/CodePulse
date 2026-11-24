import { Test, TestingModule } from '@nestjs/testing';
import { EtcdWatcherService } from './etcd-watcher.service';
import { DynamicConfigReloaderService } from './dynamic-config-reloader.service';

describe('DynamicConfigReloaderService & EtcdWatcherService', () => {
  let watcher: EtcdWatcherService;
  let reloader: DynamicConfigReloaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EtcdWatcherService, DynamicConfigReloaderService],
    }).compile();

    watcher = module.get<EtcdWatcherService>(EtcdWatcherService);
    reloader = module.get<DynamicConfigReloaderService>(DynamicConfigReloaderService);
    reloader.onModuleInit();
  });

  afterEach(() => {
    reloader.reset();
  });

  describe('Initial Default Configuration', () => {
    it('should load default feature flags and rate limits', () => {
      const config = reloader.getConfig();
      expect(config.featureFlags.enableAiHintEngine).toBe(true);
      expect(config.featureFlags.enableBetaCompiler).toBe(false);
      expect(reloader.getRateLimit('apiGateway')?.rpm).toBe(120);
      expect(reloader.getScoringWeights().accuracy).toBe(0.45);
    });
  });

  describe('Live Hot-Reload Propagation (<100ms)', () => {
    it('should propagate valid configuration update via etcd watcher stream', async () => {
      const updatePayload = {
        featureFlags: {
          enableBetaCompiler: true,
        },
        rateLimits: {
          apiGateway: { rpm: 200, burst: 50 },
        },
      };

      const event = await watcher.putKey(
        `${DynamicConfigReloaderService.CONFIG_PREFIX}features`,
        JSON.stringify(updatePayload),
      );

      const result = await reloader.handleEtcdConfigEvent(event);
      expect(result.success).toBe(true);
      expect(result.rollbackPerformed).toBeFalsy();

      // Verify active config updated
      expect(reloader.getFeatureFlag('enableBetaCompiler')).toBe(true);
      expect(reloader.getRateLimit('apiGateway')?.rpm).toBe(200);
      expect(reloader.getRateLimit('apiGateway')?.burst).toBe(50);
    });
  });

  describe('Syntax Error and Schema Validation with Atomic Rollback', () => {
    it('should automatically rollback when invalid JSON syntax is supplied', async () => {
      const initialConfig = reloader.getConfig();

      const corruptEvent = await watcher.putKey(
        `${DynamicConfigReloaderService.CONFIG_PREFIX}broken`,
        '{"featureFlags": { unclosed json',
      );

      const result = await reloader.handleEtcdConfigEvent(corruptEvent);
      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      expect(result.error).toContain('Config JSON syntax error');

      // Verify configuration remains untouched
      expect(reloader.getConfig().featureFlags).toEqual(initialConfig.featureFlags);
    });

    it('should rollback when scoring weights violate the sum constraint', async () => {
      const badWeightsPayload = {
        scoringWeights: {
          speed: 0.8,
          accuracy: 0.8, // sum = 1.6 > 1.0
        },
      };

      const event = await watcher.putKey(
        `${DynamicConfigReloaderService.CONFIG_PREFIX}weights`,
        JSON.stringify(badWeightsPayload),
      );

      const result = await reloader.handleEtcdConfigEvent(event);
      expect(result.success).toBe(false);
      expect(result.rollbackPerformed).toBe(true);
      expect(result.error).toContain('Scoring weights must sum to 1.0');

      // Verify scoring weights were not corrupted
      expect(reloader.getScoringWeights().accuracy).toBe(0.45);
    });

    it('should reject invalid rate limit parameters', () => {
      expect(() => {
        reloader.validateConfigSchema({
          rateLimits: {
            api: { rpm: -10, burst: 5 },
          },
        });
      }).toThrow('Rate limit for \'api\' must define positive rpm');
    });
  });

  describe('Manual Revision Rollback', () => {
    it('should allow rolling back to a previous revision snapshot', async () => {
      const originalVersion = reloader.getConfig().version;

      // Apply update
      const event = await watcher.putKey(
        `${DynamicConfigReloaderService.CONFIG_PREFIX}v2`,
        JSON.stringify({ featureFlags: { enableGamificationV2: true } }),
      );
      await reloader.handleEtcdConfigEvent(event);
      expect(reloader.getFeatureFlag('enableGamificationV2')).toBe(true);

      // Roll back to original version
      const rollbackSuccess = reloader.rollbackToRevision(originalVersion);
      expect(rollbackSuccess).toBe(true);
      expect(reloader.getFeatureFlag('enableGamificationV2')).toBe(false);
    });
  });
});
