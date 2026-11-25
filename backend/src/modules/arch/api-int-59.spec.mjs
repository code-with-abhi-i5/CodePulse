import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlFieldDeprecationTelemetryService } from './api-int-59.service.ts';

describe('GraphqlFieldDeprecationTelemetryService (API-INT-59)', () => {
  it('logs client accesses of deprecated schema fields and tallies usage metrics', () => {
    const telemetry = new GraphqlFieldDeprecationTelemetryService();
    telemetry.recordUsage('legacyPoints', 'mobile-app-v1');
    telemetry.recordUsage('legacyPoints', 'mobile-app-v1');
    telemetry.recordUsage('legacyPoints', 'web-client');

    assert.strictEqual(telemetry.getUsageCount('legacyPoints'), 3);
    assert.strictEqual(telemetry.getUsageCount('modernPoints'), 0);
  });
});
