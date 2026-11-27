import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeTelemetrySanitizer } from './dark-telemetry-sanitizer.service.ts';

describe('DarkThemeTelemetrySanitizer [L2-ERROR-RETRY-OFFLINE-027]', () => {
  const s = new DarkThemeTelemetrySanitizer();

  test('scrubs PII and attaches dark theme telemetry tags', () => {
    const res = s.scrubAndTag('Crash for test@user.com');
    assert.equal(res.clean, 'Crash for [REDACTED]');
    assert.equal(res.theme, 'dark-high-contrast');
  });
});
