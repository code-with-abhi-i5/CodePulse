import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AcmeCertService } from '../security/acme-cert.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;
  let acmeCertService: jest.Mocked<AcmeCertService>;

  beforeEach(async () => {
    adminService = {
      deleteUser: jest
        .fn()
        .mockResolvedValue({ success: true, message: 'User deleted' }),
      setMaintenanceMode: jest
        .fn()
        .mockResolvedValue({ success: true, maintenance: true }),
    } as unknown as jest.Mocked<AdminService>;

    acmeCertService = {
      getCertificateStatus: jest.fn().mockReturnValue({
        configured: true,
        autoRenewalEnabled: true,
        challengeType: 'http-01',
        domain: 'codepulse.dev',
        directoryUrl: 'https://acme-v02.api.letsencrypt.org/directory',
        lastRenewalAttemptAt: '2026-11-17T00:00:00.000Z',
        lastRenewalSuccessAt: '2026-11-17T00:00:00.000Z',
        lastError: null,
        certificate: {
          domain: 'codepulse.dev',
          subject: 'CN=codepulse.dev',
          issuer: "CN=Let's Encrypt Authority",
          validFrom: '2026-11-17T00:00:00.000Z',
          validTo: '2027-02-15T00:00:00.000Z',
          daysRemaining: 90,
          serialNumber: '123456',
          fingerprint256: 'AA:BB:CC',
          isExpiringSoon: false,
          isUrgentExpiry: false,
        },
        tlsReloader: {
          hasActiveContext: true,
          registeredServerCount: 1,
          lastReloadedAt: '2026-11-17T00:00:00.000Z',
        },
      }),
      checkAndRenewCertificate: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AcmeCertService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: AcmeCertService, useValue: acmeCertService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should delete user via adminService', async () => {
    const res = await controller.deleteUser('user-1');
    expect(adminService.deleteUser).toHaveBeenCalledWith('user-1');
    expect(res).toEqual({ success: true, message: 'User deleted' });
  });

  it('should toggle maintenance mode via adminService', async () => {
    const res = await controller.toggleMaintenance(true);
    expect(adminService.setMaintenanceMode).toHaveBeenCalledWith(true);
    expect(res).toEqual({ success: true, maintenance: true });
  });

  it('should return SSL certificate status via GET /admin/ssl-status', () => {
    const status = controller.getSslStatus();
    expect(acmeCertService.getCertificateStatus).toHaveBeenCalled();
    expect(status.domain).toBe('codepulse.dev');
    expect(status.certificate?.daysRemaining).toBe(90);
  });

  it('should manually trigger SSL renewal via POST /admin/ssl-renew', async () => {
    const res = await controller.triggerSslRenewal();
    expect(acmeCertService.checkAndRenewCertificate).toHaveBeenCalled();
    expect(res.renewed).toBe(true);
    expect(res.status.domain).toBe('codepulse.dev');
  });
});
