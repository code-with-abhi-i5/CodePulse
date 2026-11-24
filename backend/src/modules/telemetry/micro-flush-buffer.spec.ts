import { Test, TestingModule } from '@nestjs/testing';
import { BatchEmitterService, TelemetryBatch } from './batch-emitter.service';
import { MicroFlushBufferService } from './micro-flush-buffer.service';

describe('MicroFlushBufferService (#1411)', () => {
  let bufferService: MicroFlushBufferService<any>;
  let emitterService: BatchEmitterService;

  beforeEach(async () => {
    emitterService = new BatchEmitterService();
    bufferService = new MicroFlushBufferService(emitterService, {
      maxBatchSize: 50,
      maxLingerMs: 30,
      highThroughputLingerMs: 10,
      burstRateThresholdPerSec: 100,
      maxBufferSize: 200,
    });
  });

  afterEach(async () => {
    await bufferService.onModuleDestroy();
    emitterService.reset();
  });

  it('should initialize cleanly with zero buffered items and default metrics', () => {
    const stats = bufferService.getStats();
    expect(stats.currentBufferSize).toBe(0);
    expect(stats.totalIngested).toBe(0);
    expect(stats.totalFlushed).toBe(0);
  });

  it('should trigger immediate flush when buffer reaches maxBatchSize (size threshold)', async () => {
    const emittedBatches: TelemetryBatch[] = [];
    emitterService.registerSink((batch) => {
      emittedBatches.push(batch);
    });

    for (let i = 0; i < 50; i++) {
      bufferService.enqueue({ eventId: `keystroke-${i}`, deltaMs: 4 });
    }

    // Wait a tick for microtask execution
    await new Promise((r) => setTimeout(r, 5));

    expect(emittedBatches.length).toBe(1);
    expect(emittedBatches[0].count).toBe(50);
    expect(emittedBatches[0].flushReason).toBe('SIZE_THRESHOLD');
    expect(emittedBatches[0].throughputMultiplier).toBeGreaterThanOrEqual(8.0);

    const stats = bufferService.getStats();
    expect(stats.flushesByCount).toBe(1);
    expect(stats.totalIngested).toBe(50);
    expect(stats.totalFlushed).toBe(50);
  });

  it('should trigger timer-based micro-flush when items linger under 25-30ms', async () => {
    const emittedBatches: TelemetryBatch[] = [];
    emitterService.registerSink((batch) => {
      emittedBatches.push(batch);
    });

    // Enqueue 10 items (less than 50 threshold)
    for (let i = 0; i < 10; i++) {
      bufferService.enqueue({ eventId: `telemetry-${i}`, cpu: 42 });
    }

    expect(emittedBatches.length).toBe(0);

    // Wait for linger timeout to expire (30ms + safety buffer)
    await new Promise((r) => setTimeout(r, 60));

    expect(emittedBatches.length).toBe(1);
    expect(emittedBatches[0].count).toBe(10);
    expect(emittedBatches[0].flushReason).toBe('LINGER_TIMEOUT');

    const stats = bufferService.getStats();
    expect(stats.flushesByTimer).toBe(1);
  });

  it('should flush pending items on shutdown without dropping records', async () => {
    const emittedBatches: TelemetryBatch[] = [];
    emitterService.registerSink((batch) => {
      emittedBatches.push(batch);
    });

    for (let i = 0; i < 15; i++) {
      bufferService.enqueue({ eventId: `shutdown-test-${i}` });
    }

    await bufferService.onModuleDestroy();

    expect(emittedBatches.length).toBe(1);
    expect(emittedBatches[0].count).toBe(15);
    expect(emittedBatches[0].flushReason).toBe('SHUTDOWN');
    expect(bufferService.getStats().currentBufferSize).toBe(0);
  });

  it('should calculate emitter throughput statistics correctly', async () => {
    const emittedBatches: TelemetryBatch[] = [];
    emitterService.registerSink((batch) => {
      emittedBatches.push(batch);
    });

    // Enqueue batch of 50
    for (let i = 0; i < 50; i++) {
      bufferService.enqueue({ key: 'A', timestamp: Date.now() });
    }
    await new Promise((r) => setTimeout(r, 5));

    const emitterStats = emitterService.getStats();
    expect(emitterStats.totalBatchesEmitted).toBe(1);
    expect(emitterStats.totalRecordsEmitted).toBe(50);
    expect(emitterStats.averageBatchSize).toBe(50);
    expect(emitterStats.averageThroughputMultiplier).toBeGreaterThanOrEqual(8.0);
  });

  it('should support enqueueMany and manual flush', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
    bufferService.enqueueMany(items);

    const flushed = await bufferService.flush('MANUAL_FLUSH');
    expect(flushed).not.toBeNull();
    expect(flushed?.count).toBe(25);
    expect(flushed?.flushReason).toBe('MANUAL_FLUSH');
  });

  it('should handle emergency overflow protection when max buffer size is exceeded', async () => {
    const smallBuffer = new MicroFlushBufferService(emitterService, {
      maxBatchSize: 100,
      maxLingerMs: 500,
      maxBufferSize: 10,
    });

    for (let i = 0; i < 15; i++) {
      smallBuffer.enqueue({ id: i });
    }

    const stats = smallBuffer.getStats();
    expect(stats.flushesByOverflow).toBeGreaterThan(0);
    await smallBuffer.onModuleDestroy();
  });
});
