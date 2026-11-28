import { CrlVerificationResult } from '../../types/security';

export class MtlsCrlVerifierService {
  private readonly revokedSerials = new Map<string, string>(); // serial -> reason

  constructor(private readonly crlIssuer: string = 'CodePulse-Intermediate-CA') {}

  public loadRevokedSerial(serialNumber: string, reason: string = 'KeyCompromise'): void {
    this.revokedSerials.set(serialNumber.toUpperCase(), reason);
  }

  public verifyCertificate(serialNumber: string): CrlVerificationResult {
    const formatted = serialNumber.toUpperCase();
    const isRevoked = this.revokedSerials.has(formatted);

    return {
      isRevoked,
      serialNumber: formatted,
      revocationReason: isRevoked ? this.revokedSerials.get(formatted) : undefined,
      crlIssuer: this.crlIssuer
    };
  }
}
