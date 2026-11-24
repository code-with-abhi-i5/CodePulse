import { Test, TestingModule } from '@nestjs/testing';
import { MemoryLeakDetectorService, HeapSample } from './memory-leak-detector.service';
import { HeapProfilerService } from './heap-profiler.service';

describe('HeapProfilerService & MemoryLeakDetectorService', () => {
  let detector: MemoryLeakDetectorService;
  let profiler: HeapProfilerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryLeakDetectorService, HeapProfilerService],
    }).compile();

    detector = module.get<MemoryLeakDetectorService>(MemoryLeakDetectorService);
    profiler = module.get<HeapProfilerService>(HeapProfilerService);
  });

  afterEach(() => {
    profiler.reset();
  });

  describe('MemoryLeakDetectorService Trend Analysis', () => {
    it('should return insufficient sample status when < 6 samples recorded', () => {
      detector.recordSample({ heapUsedBytes: 100 * 1024 * 1024 });
      detector.recordSample({ heapUsedBytes: 105 * 1024 * 1024 });

      const trend = detector.analyzeTrend();
      expect(trend.isLeakSuspected).toBe(false);
      expect(trend.sampleCount).toBe(2);
    });

    it('should NOT flag normal GC sawtooth behavior as a memory leak', () => {
      const t0 = 1000000;
      // Normal cyclical GC sawtooth: climbs then drops periodically
      const sawtoothSamples = [
        100, 150, 200, 105, 160, 210, 108, 165, 215, 110,
      ].map((mb, i) => ({
        timestamp: t0 + i * 3 * 60 * 1000, // Every 3 mins over 30 mins
        heapUsedBytes: mb * 1024 * 1024,
      }));

      for (const s of sawtoothSamples) {
        detector.recordSample(s);
      }

      const trend = detector.analyzeTrend();
      // Sawtooth correlation R^2 should be low, not steady monotonic leak
      expect(trend.isLeakSuspected).toBe(false);
      expect(trend.rSquaredScore).toBeLessThan(0.85);
    });

    it('should accurately detect monotonic steady memory leak over 30 minutes', () => {
      const t0 = 1000000;
      // Steady leak of +3MB every 3 minutes (1MB/min baseline)
      const leakSamples: Partial<HeapSample>[] = [];
      let currentMb = 200;

      for (let i = 0; i <= 10; i++) {
        currentMb += 6; // +6MB every 3 mins = 2MB/min slope
        leakSamples.push({
          timestamp: t0 + i * 3 * 60 * 1000,
          heapUsedBytes: currentMb * 1024 * 1024,
        });
      }

      for (const s of leakSamples) {
        detector.recordSample(s);
      }

      const trend = detector.analyzeTrend();
      expect(trend.isLeakSuspected).toBe(true);
      expect(trend.slopeBytesPerMinute).toBeGreaterThanOrEqual(detector.leakSlopeThresholdBytesPerMin);
      expect(trend.rSquaredScore).toBeGreaterThan(0.95); // Extremely high linearity
      expect(trend.sustainedGrowthMinutes).toBeGreaterThanOrEqual(25);
      expect(trend.projectedOomMinutes).toBeDefined();
    });
  });

  describe('HeapProfilerService Snapshot Capture and Paging', () => {
    it('should capture snapshot and upload to S3 upon leak detection', async () => {
      const t0 = 1000000;
      // Feed leak samples
      for (let i = 0; i <= 10; i++) {
        detector.recordSample({
          timestamp: t0 + i * 3 * 60 * 1000,
          heapUsedBytes: (150 + i * 10) * 1024 * 1024, // +3.3MB/min
        });
      }

      const trend = detector.analyzeTrend();
      expect(trend.isLeakSuspected).toBe(true);

      const snapshot = await profiler.handleLeakDetected(trend, t0 + 31 * 60 * 1000);
      expect(snapshot).toBeDefined();
      expect(snapshot?.s3Url).toContain('s3://codepulse-core-dumps');
      expect(snapshot?.filename).toContain('.heapsnapshot');

      // Verify on-call PagerDuty alert dispatched
      const alerts = profiler.getDispatchedAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].severity).toBe('CRITICAL');
      expect(alerts[0].snapshotS3Url).toBe(snapshot?.presignedDownloadUrl);
    });

    it('should enforce cooldown between snapshot captures to prevent storming', async () => {
      const t0 = 1000000;
      const fakeAnalysis = {
        isLeakSuspected: true,
        slopeBytesPerMinute: 2000000,
        rSquaredScore: 0.98,
        sustainedGrowthMinutes: 30,
        projectedOomMinutes: 40,
        sampleCount: 10,
        currentHeapUsedMb: 400,
      };

      const snap1 = await profiler.handleLeakDetected(fakeAnalysis, t0);
      expect(snap1).not.toBeNull();

      // Attempt 2nd snapshot 2 minutes later (within 15m cooldown)
      const snap2 = await profiler.handleLeakDetected(fakeAnalysis, t0 + 2 * 60 * 1000);
      expect(snap2).toBeNull(); // Suppressed by cooldown

      // After 16 minutes (cooldown elapsed)
      const snap3 = await profiler.handleLeakDetected(fakeAnalysis, t0 + 16 * 60 * 1000);
      expect(snap3).not.toBeNull();
    });
  });
});
