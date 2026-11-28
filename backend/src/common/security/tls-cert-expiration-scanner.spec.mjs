import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TlsCertExpirationScannerService {
  constructor(renewalThresholdDays = 30) {
    this.renewalThresholdDays = renewalThresholdDays;
  }

  scanCertificate(domain, expiryTimestampMs, now = Date.now()) {
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

describe('TlsCertExpirationScannerService', () => {
  const scanner = new TlsCertExpirationScannerService(30);

  it('flags certificates within renewal threshold and triggers ACME HTTP-01 challenge', () => {
    const now = Date.now();
    const expirySoon = now + 15 * 24 * 60 * 60 * 1000; // 15 days left
    const report = scanner.scanCertificate('codepulse.io', expirySoon, now);

    assert.equal(report.needsRenewal, true);
    assert.equal(report.daysRemaining, 15);
    assert.equal(report.issuedAcmeChallenge, 'HTTP-01');
  });

  it('keeps healthy certificates with ample remaining lifespan unflagged', () => {
    const now = Date.now();
    const expiryFar = now + 90 * 24 * 60 * 60 * 1000; // 90 days left
    const report = scanner.scanCertificate('codepulse.io', expiryFar, now);

    assert.equal(report.needsRenewal, false);
    assert.equal(report.daysRemaining, 90);
    assert.equal(report.issuedAcmeChallenge, undefined);
  });
});
