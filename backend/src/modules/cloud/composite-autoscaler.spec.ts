import { Test, TestingModule } from '@nestjs/testing';
import { QueueVelocityProbeService } from './queue-velocity-probe.service';
import { CompositeAutoscalerService, ResourceMetrics } from './composite-autoscaler.service';

describe('CompositeAutoscalerService & QueueVelocityProbeService', () => {
  let probe: QueueVelocityProbeService;
  let autoscaler: CompositeAutoscalerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueVelocityProbeService, CompositeAutoscalerService],
    }).compile();

    probe = module.get<QueueVelocityProbeService>(QueueVelocityProbeService);
    autoscaler = module.get<CompositeAutoscalerService>(CompositeAutoscalerService);
  });

  afterEach(() => {
    autoscaler.reset();
  });

  describe('QueueVelocityProbeService', () => {
    it('should initialize with empty samples and return zero velocity', () => {
      const v = probe.calculateVelocity();
      expect(v.currentDepth).toBe(0);
      expect(v.velocityItemsPerSec).toBe(0);
      expect(v.accelerationItemsPerSec2).toBe(0);
      expect(v.isSurgeDetected).toBe(false);
    });

    it('should compute positive velocity (dQ/dt) when backlog builds', () => {
      const t0 = 1000000;
      probe.recordSample(10, 20, t0);
      const v1 = probe.recordSample(110, 20, t0 + 2000); // +100 items in 2s => 50 items/s

      expect(v1.currentDepth).toBe(110);
      expect(v1.velocityItemsPerSec).toBe(50);
      expect(v1.isSurgeDetected).toBe(true);
    });

    it('should calculate acceleration when 3 samples are recorded', () => {
      const t0 = 1000000;
      probe.recordSample(10, 20, t0);
      probe.recordSample(30, 20, t0 + 1000); // vel = 20
      const v = probe.recordSample(100, 20, t0 + 2000); // vel = 70 => accel = 50

      expect(v.accelerationItemsPerSec2).toBeGreaterThan(0);
      expect(v.projectedDepthIn60Sec).toBeGreaterThan(100);
    });
  });

  describe('CompositeAutoscalerService', () => {
    it('should maintain initial minimum replicas under low load', () => {
      expect(autoscaler.getCurrentReplicas()).toBe(2);

      const metrics: ResourceMetrics = {
        cpuUtilizationPct: 20,
        memoryUtilizationPct: 30,
        queueDepth: 5,
        drainRatePerSec: 50,
      };

      const result = autoscaler.evaluateMetrics(metrics);
      expect(result.action).toBe('NO_OP');
      expect(result.desiredReplicas).toBe(2);
    });

    it('should scale out when CPU utilization spikes', () => {
      autoscaler.setInitialReplicas(2);

      const metrics: ResourceMetrics = {
        cpuUtilizationPct: 95, // 95 / 70 => ceil(2 * 1.35) = 3
        memoryUtilizationPct: 40,
        queueDepth: 0,
      };

      const result = autoscaler.evaluateMetrics(metrics);
      expect(result.action).toBe('SCALE_UP');
      expect(result.desiredReplicas).toBeGreaterThan(2);
      expect(result.contributingFactor).toBe('CPU');
    });

    it('should trigger emergency surge scale-up when queue velocity escalates', () => {
      autoscaler.setInitialReplicas(2);
      const t0 = 1000000;

      // Seed probe
      probe.recordSample(100, 50, t0);
      const metrics: ResourceMetrics = {
        cpuUtilizationPct: 50,
        memoryUtilizationPct: 50,
        queueDepth: 1200, // Surge of 1100 in 2s
        drainRatePerSec: 50,
      };

      const result = autoscaler.evaluateMetrics(metrics, t0 + 2000);
      expect(result.action).toBe('SCALE_UP');
      expect(result.desiredReplicas).toBeGreaterThanOrEqual(10);
      expect(result.contributingFactor).toBe('QUEUE_VELOCITY');

      const executed = autoscaler.executeScaling(result, t0 + 2000);
      expect(executed).toBe(true);
      expect(autoscaler.getCurrentReplicas()).toBe(result.desiredReplicas);
      expect(autoscaler.getHistory().length).toBe(1);
    });

    it('should respect scale-down stabilization window to avoid flapping', () => {
      autoscaler.setInitialReplicas(20);
      const t0 = 1000000;

      // First scale-up to establish last scaling time
      const upMetrics: ResourceMetrics = {
        cpuUtilizationPct: 90,
        memoryUtilizationPct: 90,
        queueDepth: 500,
      };
      const upRes = autoscaler.evaluateMetrics(upMetrics, t0);
      autoscaler.executeScaling(upRes, t0);

      // Immediately after, traffic drops to zero
      const idleMetrics: ResourceMetrics = {
        cpuUtilizationPct: 5,
        memoryUtilizationPct: 10,
        queueDepth: 0,
      };

      // 10 seconds later (well within 300s scale-down cooldown)
      const prematureDown = autoscaler.evaluateMetrics(idleMetrics, t0 + 10000);
      expect(prematureDown.action).toBe('NO_OP');
      expect(prematureDown.contributingFactor).toBe('STABILIZED');

      // 301 seconds later (past stabilization window)
      const validDown = autoscaler.evaluateMetrics(idleMetrics, t0 + 301000);
      expect(validDown.action).toBe('SCALE_DOWN');
      expect(validDown.desiredReplicas).toBeLessThan(autoscaler.getCurrentReplicas());
    });

    it('should clamp desired replicas within policy bounds', () => {
      autoscaler.updatePolicy({ minReplicas: 3, maxReplicas: 10 });
      autoscaler.setInitialReplicas(3);

      const hugeMetrics: ResourceMetrics = {
        cpuUtilizationPct: 2000,
        memoryUtilizationPct: 2000,
        queueDepth: 50000,
      };

      const result = autoscaler.evaluateMetrics(hugeMetrics);
      expect(result.desiredReplicas).toBe(10); // Clamped at maxReplicas
    });
  });
});
