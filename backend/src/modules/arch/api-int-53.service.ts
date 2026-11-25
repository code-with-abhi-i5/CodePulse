/**
 * Architecture Service: Webhook mTLS Client Certificate Validator
 * Subsystem: Enterprise Transport Security
 */

export interface CertClaims {
  subjectCN: string;
  issuerCN: string;
  validTo: number;
}

export class WebhookMtlsClientCertValidatorService {
  private readonly allowedIssuers = new Set<string>();

  public registerTrustedIssuer(issuerCN: string): void {
    this.allowedIssuers.add(issuerCN);
  }

  public validateCert(cert: CertClaims, now: number = Date.now()): { valid: boolean; reason?: string } {
    if (now > cert.validTo) {
      return { valid: false, reason: 'Client certificate has expired' };
    }
    if (!this.allowedIssuers.has(cert.issuerCN)) {
      return { valid: false, reason: 'Untrusted certificate issuer' };
    }
    return { valid: true };
  }
}
