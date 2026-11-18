import { Test, TestingModule } from '@nestjs/testing';
import { AcmeCertService, IAcmeProtocolClient } from './acme-cert.service';
import { TlsReloaderService } from '../../common/services/tls-reloader.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

/* eslint-disable @typescript-eslint/unbound-method */

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AcmeCertService', () => {
  let service: AcmeCertService;
  let tlsReloader: TlsReloaderService;
  const testCertDir = path.resolve(__dirname, '../../../test-certs-tmp');

  const valid90DayCert = [
    '-----BEGIN CERTIFICATE-----',
    'MIIDETCCAfmgAwIBAgIUaqZevn2aOtPASVTrswm/0rGn8MEwDQYJKoZIhvcNAQEL',
    'BQAwGDEWMBQGA1UEAwwNY29kZXB1bHNlLmRldjAeFw0yNjExMTcxNzU4NTlaFw0y',
    'NzAyMTUxNzU4NTlaMBgxFjAUBgNVBAMMDWNvZGVwdWxzZS5kZXYwggEiMA0GCSqG',
    'SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC2OrEKoa/wHWH0aCZ48DcbHh5nuao8mTLr',
    'QNCePHmlbWmkZw78XSinv7bobYKNYdIEdmSkenep2HyZmok8ZbMovwbP0/mHWJWL',
    '+ByJ9k06WPseURjJ2ACEOZMLR8KTzeLMPNitHumx/D4jAX/E7cpJOF5kODQGD7mm',
    'xmf2qlDIhoZXiwF0gejh+X5V7S/rdvmH5M7nhc/Y9hbZTl1Q9OvZQE0GXAEDTUO0',
    't6lgdfbqrGQJZM98iae9Fx+VCfa6oNFy64KaXX5g2vxDJIFHQrQG3Ujbt5ZuTU+c',
    'SFLjgqsO2Mocd8KozKlx5VJJNJvHAshIuiZYCYP03Jumn5AP1z5JAgMBAAGjUzBR',
    'MB0GA1UdDgQWBBRfL2P+F1iN6ClsVjcNBPKmy+ak6TAfBgNVHSMEGDAWgBRfL2P+',
    'F1iN6ClsVjcNBPKmy+ak6TAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA',
    'A4IBAQB5qOgEAPZEQ57A+ekksiSycqQbjPsG0rMHYAtmFQGTWlh3yQz9wAM4YqtZ',
    'w9POOOFOnZiPkVsqOxqjSmyYCP5KpXTlbz0Kp3W1KprdkZh+8bs8LvOzftyB2VRJ',
    'nCkeUi/58nyycaaM7HOBm/5pM4S6LHO3d9XQdhWxe3nCq4Udx/UMo3Ft9ELx2cQy',
    'M8RdaxX7jkM79mzB/KW2SCTe3DWIWpoaKJ4vEtHEUwPfxT2B0+mIFV1h/nck2fm6',
    'AWl9RoIz2boZt79w7jgts+fRebeJXCbXwpzHLp9JEg760U9qDymNVj5iTw1xtBCy',
    'GwITSgwnmxSvdM/v8/zRZvVio6AA',
    '-----END CERTIFICATE-----',
  ].join('\n');

  const expiring5DayCert = [
    '-----BEGIN CERTIFICATE-----',
    'MIIDETCCAfmgAwIBAgIUHkao5p3WiLBu8ooCR1wdwlNdQ1gwDQYJKoZIhvcNAQEL',
    'BQAwGDEWMBQGA1UEAwwNY29kZXB1bHNlLmRldjAeFw0yNjExMTcxNzU5MDhaFw0y',
    'NjExMjIxNzU5MDhaMBgxFjAUBgNVBAMMDWNvZGVwdWxzZS5kZXYwggEiMA0GCSqG',
    'SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDgsBn4zhA12s++q92xl0kAV+SeFGSvVlu9',
    'b1spH9T9QzVWkSw8VlDkU7JYTb32uBnrky/GyoW146Y1YhfN4LafpREuSBiE6AFg',
    'f0tIrlluiJYkIDYFM40ADYqrYgzwRhMIEDgjvUAkD5QdaGZPsJOj2SLdANtyD4fn',
    'BVRq9a6Stpex7EJp/HMKqHpm2sJuo344x/5tT56xFQehOyhk5piA6xl2yxpuSS5Z',
    'pHrrdwH9ooAcQCFaN70iOQ51NvPPjYvJ6DSYgv8cWCGs6oozP59kE0nyilF8vaOZ',
    'MVTCqUzt4ySxrh3zo3jGKkXw9HrWAw2aTWtARXo7EQRcdGeYq4JZAgMBAAGjUzBR',
    'MB0GA1UdDgQWBBQ1C17xU0siMYcl1Wzzy3GNBfRpHDAfBgNVHSMEGDAWgBQ1C17x',
    'U0siMYcl1Wzzy3GNBfRpHDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA',
    'A4IBAQBznbpCgmbnbMv1+EmM22XxMhjpPHxcdXPMOVUsi9bubwjFsWIreR1TB69M',
    'O5kQM6tBUL0LQtKXGQLadHx9At1Oc1XtJ4XwMeORnDG8O7HBCIpKMEyBT+SyqJ+0',
    'xzCOLYm6sGqjrdA20gQU8/csoDqOWnY95Rs6xtmhUssNKkN8+X8WXjej44gtfk81',
    'WZlLqRbfDUt6e/GO7y9CqCNdUU2YxKFvaXHxO1isJz6D7vddGYv2uOyTDGlCN1Fk',
    'VSsaN7JNDJ2ed21BipdmoFgW7pu4sCWSlwgOHF0CnIdM7ZK4AQ3zXRV5xSMvLGIk',
    'lqxvhB85nL8Tgd+49vowd/2RoKTo',
    '-----END CERTIFICATE-----',
  ].join('\n');

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ data: {} });

    if (!fs.existsSync(testCertDir)) {
      fs.mkdirSync(testCertDir, { recursive: true });
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [AcmeCertService, TlsReloaderService],
    }).compile();

    service = module.get<AcmeCertService>(AcmeCertService);
    tlsReloader = module.get<TlsReloaderService>(TlsReloaderService);

    service.configure({
      certStorageDir: testCertDir,
      domain: 'codepulse.dev',
      discordWebhookUrl: 'https://discord.com/api/webhooks/mock',
    });
  });

  afterEach(() => {
    if (fs.existsSync(testCertDir)) {
      fs.rmSync(testCertDir, { recursive: true, force: true });
    }
  });

  it('should parse X.509 certificate and extract correct validity days', () => {
    const meta = service.parseCertificate(valid90DayCert, 'codepulse.dev');
    expect(meta.domain).toBe('codepulse.dev');
    expect(meta.daysRemaining).toBeGreaterThan(30);
    expect(meta.isExpiringSoon).toBe(false);
    expect(meta.isUrgentExpiry).toBe(false);
  });

  it('should detect expiring certificates (< 30 days and < 7 days)', () => {
    const meta = service.parseCertificate(expiring5DayCert, 'codepulse.dev');
    expect(meta.domain).toBe('codepulse.dev');
    expect(meta.daysRemaining).toBeLessThan(7);
    expect(meta.isExpiringSoon).toBe(true);
    expect(meta.isUrgentExpiry).toBe(true);
  });

  it('should return initial SSL status when no certificate is installed', () => {
    const status = service.getCertificateStatus();
    expect(status.configured).toBe(false);
    expect(status.certificate).toBeNull();
    expect(status.domain).toBe('codepulse.dev');
  });

  it('should successfully execute HTTP-01 ACME protocol renewal and hot-reload TLS credentials', async () => {
    const reloadSpy = jest.spyOn(tlsReloader, 'reload').mockReturnValue({
      success: true,
      reloadedAt: new Date().toISOString(),
      activeServerCount: 1,
    });

    const mockAcmeClient: IAcmeProtocolClient = {
      createAccount: jest
        .fn()
        .mockResolvedValue({ accountUrl: 'https://acme/account/1' }),
      createOrder: jest.fn().mockResolvedValue({
        orderUrl: 'https://acme/orders/123',
        authorizations: ['https://acme/authz/1'],
      }),
      getAuthorizations: jest.fn().mockResolvedValue({
        http01: {
          token: 'token-abc',
          keyAuthorization: 'token-abc.secretkeyauth',
          url: 'https://acme/challenges/http01',
        },
      }),
      triggerChallengeValidation: jest
        .fn()
        .mockResolvedValue({ status: 'valid' }),
      finalizeOrder: jest
        .fn()
        .mockResolvedValue({ certificateUrl: 'https://acme/orders/123/cert' }),
      downloadCertificate: jest
        .fn()
        .mockResolvedValue({ certPem: valid90DayCert }),
    };

    service.setAcmeClient(mockAcmeClient);

    const renewed = await service.checkAndRenewCertificate();

    expect(renewed).toBe(true);
    expect(mockAcmeClient.createAccount).toHaveBeenCalled();
    expect(mockAcmeClient.createOrder).toHaveBeenCalledWith('codepulse.dev');
    expect(mockAcmeClient.triggerChallengeValidation).toHaveBeenCalledWith(
      'https://acme/challenges/http01',
    );
    expect(mockAcmeClient.finalizeOrder).toHaveBeenCalled();
    expect(mockAcmeClient.downloadCertificate).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalledWith(valid90DayCert, expect.any(String));

    // Verify token was registered and retrievable
    expect(service.getHttpChallenge('token-abc')).toBe(
      'token-abc.secretkeyauth',
    );

    const status = service.getCertificateStatus();
    expect(status.configured).toBe(true);
    expect(status.lastRenewalSuccessAt).toBeDefined();
    expect(status.lastError).toBeNull();
  });

  it('should execute DNS-01 ACME renewal and alert Discord when DNS challenge fails', async () => {
    service.configure({ challengeType: 'dns-01' });

    const mockAcmeClient: IAcmeProtocolClient = {
      createAccount: jest
        .fn()
        .mockResolvedValue({ accountUrl: 'https://acme/account/1' }),
      createOrder: jest.fn().mockResolvedValue({
        orderUrl: 'https://acme/orders/456',
        authorizations: ['https://acme/authz/2'],
      }),
      getAuthorizations: jest.fn().mockResolvedValue({
        dns01: {
          token: 'dns-token-1',
          keyAuthorization: 'dns-key-auth',
          url: 'https://acme/challenges/dns01',
          dnsRecordValue: 'TXT_RECORD_HASH_VAL',
        },
      }),
      triggerChallengeValidation: jest
        .fn()
        .mockResolvedValue({ status: 'invalid' }),
      finalizeOrder: jest.fn(),
      downloadCertificate: jest.fn(),
    };

    service.setAcmeClient(mockAcmeClient);

    const renewed = await service.checkAndRenewCertificate();

    expect(renewed).toBe(false);
    expect(mockAcmeClient.triggerChallengeValidation).toHaveBeenCalled();
    expect(mockedAxios.post).toHaveBeenCalled();

    // Check Discord alert call
    const postCall = mockedAxios.post.mock.calls[0];
    const postBody = postCall[1] as {
      username: string;
      embeds: { title: string; description: string }[];
    };
    expect(postBody.embeds[0].title).toContain('DNS-01 Challenge Failed');
    expect(postBody.embeds[0].description).toContain('codepulse.dev');
  });

  it('should skip renewal if active certificate is still valid for > 30 days', async () => {
    // Write valid 90-day cert to storage
    fs.writeFileSync(
      path.join(testCertDir, 'cert.pem'),
      valid90DayCert,
      'utf8',
    );
    fs.writeFileSync(path.join(testCertDir, 'privkey.pem'), 'KEY_DATA', 'utf8');

    const mockAcmeClient: IAcmeProtocolClient = {
      createAccount: jest.fn(),
      createOrder: jest.fn(),
      getAuthorizations: jest.fn(),
      triggerChallengeValidation: jest.fn(),
      finalizeOrder: jest.fn(),
      downloadCertificate: jest.fn(),
    };

    service.setAcmeClient(mockAcmeClient);

    const renewed = await service.checkAndRenewCertificate();

    expect(renewed).toBe(false);
    expect(mockAcmeClient.createOrder).not.toHaveBeenCalled();
  });

  it('should alert Discord with urgent warning when cert is < 7 days from expiry and renewal fails', async () => {
    // Write 5-day cert to storage
    fs.writeFileSync(
      path.join(testCertDir, 'cert.pem'),
      expiring5DayCert,
      'utf8',
    );
    fs.writeFileSync(path.join(testCertDir, 'privkey.pem'), 'KEY_DATA', 'utf8');

    const mockAcmeClient: IAcmeProtocolClient = {
      createAccount: jest
        .fn()
        .mockRejectedValue(new Error('ACME directory offline')),
      createOrder: jest.fn(),
      getAuthorizations: jest.fn(),
      triggerChallengeValidation: jest.fn(),
      finalizeOrder: jest.fn(),
      downloadCertificate: jest.fn(),
    };

    service.setAcmeClient(mockAcmeClient);

    const renewed = await service.checkAndRenewCertificate();

    expect(renewed).toBe(false);
    expect(mockedAxios.post).toHaveBeenCalled();
    const postCall = mockedAxios.post.mock.calls[0];
    const postBody = postCall[1] as {
      embeds: { title: string; description: string }[];
    };
    expect(postBody.embeds[0].title).toContain(
      'CRITICAL: SSL Certificate Expiring Soon!',
    );
  });
});
