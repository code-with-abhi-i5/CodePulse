import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CrashTelemetryPiiScrubberVerifier } from './telemetry-pii-verifier.service.ts';

describe('CrashTelemetryPiiScrubberVerifier [L2-ERROR-RETRY-OFFLINE-047]', () => {
  const scrubber = new CrashTelemetryPiiScrubberVerifier();

  test('scrubs credentials and verifies payload is safe for telemetry transport', () => {
    const raw = 'Error uploading crash for user admin@example.com using Bearer eyJhbGciOiJIUz and token ghp_12345678901234567890';
    const scrubbed = scrubber.scrubString(raw);
    assert.ok(scrubbed.includes('[REDACTED_EMAIL]'));
    assert.ok(scrubbed.includes('Bearer [REDACTED_TOKEN]'));
    assert.ok(scrubbed.includes('[REDACTED_APIKEY]'));
    assert.equal(scrubber.verifyClean(scrubbed), true);
  });
});
