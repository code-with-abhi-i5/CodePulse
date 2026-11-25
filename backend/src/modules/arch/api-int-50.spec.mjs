import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiTelemetryPercentileService } from './api-int-50.service.ts';

describe('ApiTelemetryPercentileService (API-INT-50)', () => {
  it('computes accurate latency percentiles over recorded telemetry samples', () => {
    const telemetry = new ApiTelemetryPercentileService();
    for (let i = 1; i <= 100; i++) {
      telemetry.recordSample({ path: '/api/v1', durationMs: i, reqBytes: 100, resBytes: 200 });
    }

    assert.strictEqual(telemetry.getPercentile(50), 50);
    assert.strictEqual(telemetry.getPercentile(95), 95);
    assert.strictEqual(telemetry.getPercentile(99), 99);
  });
});
