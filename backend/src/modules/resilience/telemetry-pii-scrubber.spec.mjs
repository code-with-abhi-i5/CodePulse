import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryPiiScrubberService } from './telemetry-pii-scrubber.service.ts';

describe('TelemetryPiiScrubberService [L2-ERROR-RETRY-OFFLINE-057]', () => {
  const scrubber = new TelemetryPiiScrubberService();

  test('scrubs email addresses and JWTs from crash strings', () => {
    const raw = 'Crash at user test.user@example.com with session eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const scrubbed = scrubber.scrubString(raw);
    assert.ok(!scrubbed.includes('test.user@example.com'));
    assert.ok(scrubbed.includes('[REDACTED_EMAIL]'));
    assert.ok(scrubbed.includes('[REDACTED_JWT]'));
  });

  test('redacts sensitive fields from telemetry payload objects recursively', () => {
    const payload = {
      user: { email: 'dev@codepulse.io', password: 'SuperSecretPassword123' },
      headers: { authorization: 'Bearer abc123def456' },
      safeData: { metric: 42 }
    };

    const sanitized = scrubber.scrubObject(payload);
    assert.equal(sanitized.user.password, '[REDACTED]');
    assert.equal(sanitized.headers.authorization, '[REDACTED]');
    assert.equal(sanitized.user.email, '[REDACTED_EMAIL]');
    assert.equal(sanitized.safeData.metric, 42);
  });
});
