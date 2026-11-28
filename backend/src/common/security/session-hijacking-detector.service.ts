import { HijackAnomalyResult } from '../../types/security';

export class SessionHijackingDetectorService {
  public evaluateFingerprint(
    knownSession: { ip: string; userAgent: string; tlsFingerprint?: string },
    incomingRequest: { ip: string; userAgent: string; tlsFingerprint?: string }
  ): HijackAnomalyResult {
    const reasons: string[] = [];
    let anomalyScore = 0;

    if (incomingRequest.userAgent !== knownSession.userAgent) {
      reasons.push('User-Agent string changed abruptly during active session');
      anomalyScore += 40;
    }

    if (incomingRequest.ip !== knownSession.ip) {
      reasons.push(`IP address changed from ${knownSession.ip} to ${incomingRequest.ip}`);
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
