import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionHijackingDetectorService } from './sec-auth-11.service.ts';

describe('SessionHijackingDetectorService (SEC-AUTH-11)', () => {
  it('detects altered device fingerprints and impossible IP subnet jumps', () => {
    const detector = new SessionHijackingDetectorService();
    const session = {
      fingerprintHash: 'fp-chrome-windows-123',
      ipAddress: '198.51.100.5',
      lastActivityTimestamp: 1000
    };

    // Valid same session
    const valid = detector.evaluateRequest(session, {
      fingerprintHash: 'fp-chrome-windows-123',
      ipAddress: '198.51.100.20', // same /24 subnet
      timestamp: 2000
    });
    assert.strictEqual(valid.isSuspicious, false);

    // Mismatched device fingerprint
    const forgedFp = detector.evaluateRequest(session, {
      fingerprintHash: 'fp-firefox-linux-456',
      ipAddress: '198.51.100.5',
      timestamp: 2000
    });
    assert.strictEqual(forgedFp.isSuspicious, true);
    assert.ok(forgedFp.reason.includes('Device fingerprint anomaly'));

    // Impossible IP subnet jump
    const ipJump = detector.evaluateRequest(session, {
      fingerprintHash: 'fp-chrome-windows-123',
      ipAddress: '203.0.113.88', // different subnet
      timestamp: 5000 // only 4s later
    });
    assert.strictEqual(ipJump.isSuspicious, true);
    assert.ok(ipJump.reason.includes('impossible speed anomaly'));
  });
});
