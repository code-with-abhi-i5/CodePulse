import { CertValidationResult } from '../../types/security';

export class PkiCertChainValidatorService {
  constructor(private readonly trustedRootCAs: Set<string> = new Set(['CodePulse-Root-CA'])) {}

  public validateChain(certificates: Array<{ subject: string; issuer: string; validFromMs: number; validToMs: number }>, now: number = Date.now()): CertValidationResult {
    const errors: string[] = [];
    if (certificates.length === 0) {
      return {
        isValid: false,
        subject: '',
        issuer: '',
        chainLength: 0,
        errors: ['Empty certificate chain provided']
      };
    }

    const leaf = certificates[0];
    const root = certificates[certificates.length - 1];

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      if (now < cert.validFromMs) {
        errors.push(`Certificate ${cert.subject} is not yet valid`);
      }
      if (now > cert.validToMs) {
        errors.push(`Certificate ${cert.subject} has expired`);
      }

      // Check chain linkage
      if (i < certificates.length - 1) {
        const nextCert = certificates[i + 1];
        if (cert.issuer !== nextCert.subject) {
          errors.push(`Chain break between ${cert.subject} (issuer: ${cert.issuer}) and next subject ${nextCert.subject}`);
        }
      }
    }

    if (!this.trustedRootCAs.has(root.issuer) && !this.trustedRootCAs.has(root.subject)) {
      errors.push(`Root issuer ${root.issuer} is not in trusted root CA store`);
    }

    return {
      isValid: errors.length === 0,
      subject: leaf.subject,
      issuer: leaf.issuer,
      chainLength: certificates.length,
      errors
    };
  }
}
