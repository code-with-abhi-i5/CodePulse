import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HighThroughputJsonStringifierService } from './perf-scale-17.service.ts';

describe('HighThroughputJsonStringifierService (PERF-SCALE-17)', () => {
  it('serializes single telemetry metric to valid JSON', () => {
    const stringifier = new HighThroughputJsonStringifierService();
    const metric = { name: 'cpu_usage', value: 42.5, timestamp: 1700000000, status: 'OK' };
    const json = stringifier.stringifyTelemetry(metric);

    assert.deepStrictEqual(JSON.parse(json), metric);
  });

  it('serializes telemetry batch and escapes quotes cleanly', () => {
    const stringifier = new HighThroughputJsonStringifierService();
    const batch = [
      { name: 'test "quoted"', value: 1, timestamp: 100, status: 'pass' }
    ];
    const json = stringifier.stringifyTelemetryBatch(batch);
    assert.deepStrictEqual(JSON.parse(json), batch);
  });
});
