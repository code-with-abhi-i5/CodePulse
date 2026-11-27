import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagTelemetryDataSanitizer } from './wcag-telemetry-sanitizer.service.ts';

describe('WcagTelemetryDataSanitizer [L2-ERROR-RETRY-OFFLINE-037]', () => {
  const sanitizer = new WcagTelemetryDataSanitizer();

  test('scrubs telemetry and flags record as accessibility audit compatible', () => {
    const rec = sanitizer.sanitizeTelemetryRecord({
      message: 'Network issue for user@domain.com',
      meta: { timestamp: 12345 }
    });
    assert.ok(!rec.message.includes('user@domain.com'));
    assert.equal(rec.a11yCompatible, true);
  });
});
