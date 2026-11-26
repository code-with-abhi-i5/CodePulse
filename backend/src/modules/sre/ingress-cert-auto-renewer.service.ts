import { CertificateStatus, RenewalEvaluation } from '../../types/sre';

export class IngressCertAutoRenewer {
  private thresholdDays: number;

  constructor(thresholdDays: number = 30) {
    this.thresholdDays = thresholdDays;
  }

  evaluateCertificate(cert: CertificateStatus): RenewalEvaluation {
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
