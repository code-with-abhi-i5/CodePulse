import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AcmeClientService, CertificateBundle } from './acme-client.service';

export interface ManagedDomainCertificate {
  domain: string;
  isWildcard: boolean;
  currentCert?: CertificateBundle;
  expiresAt: Date;
  daysRemaining: number;
  status: 'ACTIVE' | 'RENEWAL_DUE' | 'RENEWING' | 'EXPIRED';
  lastRenewedAt?: Date;
  renewalAttempts: number;
}

export interface RenewalCycleReport {
  scannedCount: number;
  renewedCount: number;
  healthyCount: number;
  failedCount: number;
  executedAt: Date;
}

@Injectable()
export class SslCertWatchtowerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SslCertWatchtowerService.name);

  // Threshold: renew automatically 30 days before expiration
  public readonly renewalThresholdDays = 30;

  private isWatchtowerRunning = false;
  private watchtowerTimer: NodeJS.Timeout | null = null;

  // In-memory catalog of managed customer & internal domains
  private readonly managedDomains = new Map<string, ManagedDomainCertificate>();
  // Active Ingress SNI TLS secrets cache (hot-reloaded without dropping connections)
  private readonly ingressTlsCache = new Map<string, CertificateBundle>();

  constructor(private readonly acmeClient: AcmeClientService) {}

  onModuleInit(): void {
    this.seedDefaultCertificates();
    this.startWatchtower();
  }

  onModuleDestroy(): void {
    this.stopWatchtower();
  }

  public seedDefaultCertificates(): void {
    const now = Date.now();
    // Domain 1: Healthy (expires in 75 days)
    this.registerDomainCertificate('codepulse.io', new Date(now + 75 * 24 * 60 * 60 * 1000));
    // Domain 2: Wildcard healthy (expires in 60 days)
    this.registerDomainCertificate('*.preview.codepulse.io', new Date(now + 60 * 24 * 60 * 60 * 1000), true);
    // Domain 3: Customer custom domain due for renewal (expires in 15 days)
    this.registerDomainCertificate('app.customer-sandbox.com', new Date(now + 15 * 24 * 60 * 60 * 1000));
  }

  public registerDomainCertificate(domain: string, expiresAt: Date, isWildcard = false): ManagedDomainCertificate {
    const daysRemaining = this.calculateDaysRemaining(expiresAt);
    const status = daysRemaining <= 0
      ? 'EXPIRED'
      : daysRemaining <= this.renewalThresholdDays
      ? 'RENEWAL_DUE'
      : 'ACTIVE';

    const entry: ManagedDomainCertificate = {
      domain,
      isWildcard,
      expiresAt,
      daysRemaining,
      status,
      renewalAttempts: 0,
    };

    this.managedDomains.set(domain, entry);
    return entry;
  }

  /**
   * Scans all managed certificates, automatically renewing any certificate with <= 30 days remaining.
   */
  public async executeRenewalScan(now = Date.now()): Promise<RenewalCycleReport> {
    this.logger.log(`Executing SSL certificate watchtower scan for ${this.managedDomains.size} domains`);
    let renewedCount = 0;
    let healthyCount = 0;
    let failedCount = 0;

    for (const [domain, entry] of this.managedDomains.entries()) {
      entry.daysRemaining = this.calculateDaysRemaining(entry.expiresAt, now);

      if (entry.daysRemaining <= this.renewalThresholdDays) {
        entry.status = 'RENEWING';
        this.logger.warn(`Domain ${domain} has ${entry.daysRemaining} days remaining (<= 30d). Triggering ACME renewal.`);

        try {
          const renewedBundle = await this.renewCertificate(domain, entry.isWildcard);
          entry.currentCert = renewedBundle;
          entry.expiresAt = renewedBundle.expiresAt;
          entry.daysRemaining = this.calculateDaysRemaining(renewedBundle.expiresAt, now);
          entry.status = 'ACTIVE';
          entry.lastRenewedAt = new Date(now);
          entry.renewalAttempts = 0;

          // Zero-downtime hot reload of Ingress TLS secret
          this.hotReloadIngressTls(domain, renewedBundle);
          renewedCount++;
        } catch (err: any) {
          entry.status = 'RENEWAL_DUE';
          entry.renewalAttempts++;
          failedCount++;
          this.logger.error(`Failed to renew ACME certificate for ${domain}: ${err.message}`);
        }
      } else {
        entry.status = 'ACTIVE';
        healthyCount++;
      }
    }

    const report: RenewalCycleReport = {
      scannedCount: this.managedDomains.size,
      renewedCount,
      healthyCount,
      failedCount,
      executedAt: new Date(now),
    };

    this.logger.log(
      `Watchtower scan finished: ${renewedCount} renewed, ${healthyCount} healthy, ${failedCount} failed`,
    );

    return report;
  }

  /**
   * Interacts with ACME client to obtain a freshly signed 90-day Let's Encrypt certificate.
   */
  public async renewCertificate(domain: string, isWildcard: boolean): Promise<CertificateBundle> {
    const domains = isWildcard ? [domain, domain.replace('*.', '')] : [domain];
    const order = await this.acmeClient.createOrder(domains);

    for (const challenge of order.challenges) {
      if (challenge.type === 'DNS-01') {
        await this.acmeClient.solveDns01Challenge(order.orderId, challenge.id);
      } else {
        await this.acmeClient.solveHttp01Challenge(order.orderId, challenge.id);
      }
    }

    return await this.acmeClient.finalizeOrderAndIssueCert(order.orderId, domain);
  }

  /**
   * Hot-reloads ingress TLS secret in-memory with zero dropped connections.
   */
  public hotReloadIngressTls(domain: string, bundle: CertificateBundle): void {
    this.ingressTlsCache.set(domain, bundle);
    this.logger.log(`Ingress SNI TLS certificate hot-reloaded for ${domain} (zero connection drops)`);
  }

  public getIngressCertificate(domain: string): CertificateBundle | undefined {
    return this.ingressTlsCache.get(domain);
  }

  public getManagedDomains(): ManagedDomainCertificate[] {
    return Array.from(this.managedDomains.values());
  }

  public calculateDaysRemaining(expiresAt: Date, now = Date.now()): number {
    const msRemaining = expiresAt.getTime() - now;
    return Math.floor(msRemaining / (24 * 60 * 60 * 1000));
  }

  public startWatchtower(): void {
    if (this.isWatchtowerRunning) return;
    this.isWatchtowerRunning = true;
    // Scan daily in production (or simulated interval)
    this.watchtowerTimer = setInterval(async () => {
      await this.executeRenewalScan();
    }, 24 * 60 * 60 * 1000);
  }

  public stopWatchtower(): void {
    if (this.watchtowerTimer) {
      clearInterval(this.watchtowerTimer);
      this.watchtowerTimer = null;
    }
    this.isWatchtowerRunning = false;
  }

  public reset(): void {
    this.stopWatchtower();
    this.managedDomains.clear();
    this.ingressTlsCache.clear();
  }
}
