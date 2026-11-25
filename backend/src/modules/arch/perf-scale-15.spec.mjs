import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventLoopLatencyWatchdogService } from './perf-scale-15.service.ts';

describe('EventLoopLatencyWatchdogService (PERF-SCALE-15)', () => {
  it('sheds non-critical traffic when event loop latency exceeds 50ms', () => {
    const watchdog = new EventLoopLatencyWatchdogService(50);
    watchdog.recordLag(65);

    assert.strictEqual(watchdog.shouldShedRequest(false), true);
    assert.strictEqual(watchdog.getStats().totalShedRequests, 1);

    // Critical requests bypass shedding
    assert.strictEqual(watchdog.shouldShedRequest(true), false);
  });

  it('allows all requests when latency is below threshold', () => {
    const watchdog = new EventLoopLatencyWatchdogService(50);
    watchdog.recordLag(12);

    assert.strictEqual(watchdog.shouldShedRequest(false), false);
    assert.strictEqual(watchdog.getStats().totalShedRequests, 0);
  });
});
