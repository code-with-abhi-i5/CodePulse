import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryEventSamplerService } from './fe-ui-24.service.ts';

describe('TelemetryEventSamplerService (FE-UI-24)', () => {
  it('throttles high-frequency telemetry events and flushes batched payloads', () => {
    const sampler = new TelemetryEventSamplerService(100);

    // Event 1 admitted
    assert.strictEqual(sampler.recordEvent('mousemove', { x: 10, y: 20 }), true);
    // Immediate event 2 throttled
    assert.strictEqual(sampler.recordEvent('mousemove', { x: 11, y: 21 }), false);

    const batch = sampler.flushBatch();
    assert.strictEqual(batch.length, 1);
    assert.strictEqual(sampler.flushBatch().length, 0);
  });
});
