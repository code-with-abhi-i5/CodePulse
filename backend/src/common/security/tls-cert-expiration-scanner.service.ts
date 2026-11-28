import { TlsScanReport } from '../../types/security';

export class TlsCertExpirationScannerService {
  constructor(private readonly renewalThresholdDays: number = 30) {}

  public scanCertificate(domain: string, expiryTimestampMs: number, now: number = Date.now()): TlsScanReport {
    const msRemaining = expiryTimestampMs - now;
    const daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));
    const needsRenewal = daysRemaining <= this.renewalThresholdDays;

    return {
      domain,
      daysRemaining,
      needsRenewal,
      issuedAcmeChallenge: needsRenewal ? 'HTTP-01' : undefined,
      expiryDateIso: new Date(expiryTimestampMs).toISOString()
    };
  }
}
