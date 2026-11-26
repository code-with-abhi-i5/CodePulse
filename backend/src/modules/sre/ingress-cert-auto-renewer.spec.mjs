import test from 'node:test';
import assert from 'node:assert/strict';

class IngressCertAutoRenewer {
  constructor(thresholdDays = 30) {
    this.thresholdDays = thresholdDays;
  }

  evaluateCertificate(cert) {
    const now = Date.now();
    const daysRemaining = Math.floor((cert.expiresAt - now) / (1000 * 60 * 60 * 24));
    const needsRenewal = daysRemaining <= this.thresholdDays;

    return {
      needsRenewal,
      daysRemaining,
      triggerAcme: needsRenewal
    };
  }
}

test('IngressCertAutoRenewer - flags TLS certificates expiring within 30 days', () => {
  const renewer = new IngressCertAutoRenewer(30);
  const now = Date.now();

  const safe = renewer.evaluateCertificate({ domain: 'api.codepulse.io', expiresAt: now + 45 * 86400000, issuer: 'LetsEncrypt' });
  assert.strictEqual(safe.needsRenewal, false);

  const expiring = renewer.evaluateCertificate({ domain: 'auth.codepulse.io', expiresAt: now + 15 * 86400000, issuer: 'LetsEncrypt' });
  assert.strictEqual(expiring.needsRenewal, true);
  assert.strictEqual(expiring.triggerAcme, true);
});
