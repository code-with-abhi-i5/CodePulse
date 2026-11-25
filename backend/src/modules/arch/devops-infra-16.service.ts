/**
 * Architecture Service: Automated SSL/TLS Certificate Renewal Daemon
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-16]
 */

export interface CertRecord {
  domain: string;
  expiresAt: number;
  lastRenewedAt: number;
  status: 'valid' | 'renewal_pending' | 'renewed' | 'expired';
}

export class SslCertRenewalDaemonService {
  private certificates: Map<string, CertRecord>;
  private renewalThresholdMs: number;

  constructor(renewalThresholdDays: number = 30) {
    this.certificates = new Map();
    this.renewalThresholdMs = renewalThresholdDays * 24 * 60 * 60 * 1000;
  }

  public registerCertificate(domain: string, expiresAt: number): void {
    this.certificates.set(domain, {
      domain,
      expiresAt,
      lastRenewedAt: Date.now(),
      status: 'valid'
    });
  }

  public checkAndRenew(domain: string, now: number = Date.now()): boolean {
    const cert = this.certificates.get(domain);
    if (!cert) return false;

    if (now >= cert.expiresAt) {
      cert.status = 'expired';
    }

    if (cert.expiresAt - now <= this.renewalThresholdMs) {
      cert.status = 'renewed';
      cert.lastRenewedAt = now;
      cert.expiresAt = now + 90 * 24 * 60 * 60 * 1000;
      return true;
    }

    return false;
  }

  public getStatus(domain: string): CertRecord | undefined {
    return this.certificates.get(domain);
  }
}
