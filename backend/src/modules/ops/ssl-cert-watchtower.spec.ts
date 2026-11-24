import { Test, TestingModule } from '@nestjs/testing';
import { AcmeClientService } from './acme-client.service';
import { SslCertWatchtowerService } from './ssl-cert-watchtower.service';

describe('SslCertWatchtowerService & AcmeClientService', () => {
  let acmeClient: AcmeClientService;
  let watchtower: SslCertWatchtowerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcmeClientService, SslCertWatchtowerService],
    }).compile();

    acmeClient = module.get<AcmeClientService>(AcmeClientService);
    watchtower = module.get<SslCertWatchtowerService>(SslCertWatchtowerService);
    watchtower.seedDefaultCertificates();
  });

  afterEach(() => {
    watchtower.reset();
  });

  describe('Certificate Expiration Monitoring', () => {
    it('should calculate days remaining and detect certificates due for renewal', () => {
      const domains = watchtower.getManagedDomains();
      expect(domains.length).toBe(3);

      const due = domains.find((d) => d.status === 'RENEWAL_DUE');
      expect(due).toBeDefined();
      expect(due?.domain).toBe('app.customer-sandbox.com');
      expect(due?.daysRemaining).toBeLessThanOrEqual(30);

      const healthy = domains.find((d) => d.domain === 'codepulse.io');
      expect(healthy?.status).toBe('ACTIVE');
      expect(healthy?.daysRemaining).toBeGreaterThan(30);
    });
  });

  describe('Automated 30-Day Renewal Scan & Ingress Hot Reload', () => {
    it('should renew certificates with <=30 days remaining and leave healthy ones alone', async () => {
      const now = Date.now();
      const report = await watchtower.executeRenewalScan(now);

      expect(report.scannedCount).toBe(3);
      expect(report.renewedCount).toBe(1); // Only customer domain was <= 30 days
      expect(report.healthyCount).toBe(2); // The other 2 had 60 and 75 days remaining
      expect(report.failedCount).toBe(0);

      // Verify the renewed domain now has 90 days validity
      const renewed = watchtower.getManagedDomains().find((d) => d.domain === 'app.customer-sandbox.com');
      expect(renewed?.status).toBe('ACTIVE');
      expect(renewed?.daysRemaining).toBeGreaterThan(80);
      expect(renewed?.currentCert?.issuer).toContain("Let's Encrypt");

      // Verify hot-reloaded into ingress TLS cache
      const ingressCert = watchtower.getIngressCertificate('app.customer-sandbox.com');
      expect(ingressCert).toBeDefined();
      expect(ingressCert?.certPem).toContain('BEGIN CERTIFICATE');
    });

    it('should support wildcard domains via DNS-01 challenge', async () => {
      const now = Date.now();
      // Force wildcard domain to 10 days remaining
      watchtower.registerDomainCertificate(
        '*.preview.codepulse.io',
        new Date(now + 10 * 24 * 60 * 60 * 1000),
        true,
      );

      const cert = await watchtower.renewCertificate('*.preview.codepulse.io', true);
      expect(cert.domain).toBe('*.preview.codepulse.io');
      expect(cert.issuer).toContain("Let's Encrypt");
    });
  });

  describe('ACME Client Order Lifecycle', () => {
    it('should create order and verify challenges', async () => {
      const order = await acmeClient.createOrder(['api.customer.io']);
      expect(order.domains).toEqual(['api.customer.io']);
      expect(order.challenges.length).toBe(1);
      expect(order.challenges[0].type).toBe('HTTP-01');

      const chalSolved = await acmeClient.solveHttp01Challenge(order.orderId, order.challenges[0].id);
      expect(chalSolved).toBe(true);

      const bundle = await acmeClient.finalizeOrderAndIssueCert(order.orderId, 'api.customer.io');
      expect(bundle.certPem).toBeDefined();
      expect(bundle.privateKeyPem).toBeDefined();
    });
  });
});
