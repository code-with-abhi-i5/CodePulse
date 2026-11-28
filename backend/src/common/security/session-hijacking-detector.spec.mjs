import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SessionHijackingDetectorService {
  evaluateFingerprint(knownSession, incomingRequest) {
    const reasons = [];
    let anomalyScore = 0;

    if (incomingRequest.userAgent !== knownSession.userAgent) {
      reasons.push('User-Agent string changed abruptly during active session');
      anomalyScore += 40;
    }

    if (incomingRequest.ip !== knownSession.ip) {
      reasons.push('IP address changed from ' + knownSession.ip + ' to ' + incomingRequest.ip);
      anomalyScore += 40;
    }

    if (
      knownSession.tlsFingerprint &&
      incomingRequest.tlsFingerprint &&
      incomingRequest.tlsFingerprint !== knownSession.tlsFingerprint
    ) {
      reasons.push('TLS client cipher fingerprint mismatch');
      anomalyScore += 50;
    }

    const isCompromised = anomalyScore >= 70;
    const revokeSession = isCompromised;

    return {
      isCompromised,
      anomalyScore,
      reasons,
      revokeSession
    };
  }
}

describe('SessionHijackingDetectorService', () => {
  const detector = new SessionHijackingDetectorService();

  it('approves requests matching initial fingerprint session attributes', () => {
    const session = { ip: '1.2.3.4', userAgent: 'Mozilla/5.0', tlsFingerprint: 'fp-1' };
    const incoming = { ip: '1.2.3.4', userAgent: 'Mozilla/5.0', tlsFingerprint: 'fp-1' };

    const result = detector.evaluateFingerprint(session, incoming);
    assert.equal(result.isCompromised, false);
    assert.equal(result.anomalyScore, 0);
  });

  it('triggers session revocation when both IP and TLS fingerprints mutate', () => {
    const session = { ip: '1.2.3.4', userAgent: 'Mozilla/5.0', tlsFingerprint: 'fp-1' };
    const incoming = { ip: '99.88.77.66', userAgent: 'Mozilla/5.0', tlsFingerprint: 'fp-2' };

    const result = detector.evaluateFingerprint(session, incoming);
    assert.equal(result.isCompromised, true);
    assert.equal(result.revokeSession, true);
    assert.ok(result.anomalyScore >= 70);
  });
});
