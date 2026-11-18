import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DynamicConfigService } from '../../config/dynamic-config.service';
import { AcmeCertService } from '../security/acme-cert.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('AdminController - Core & SSL', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;
  let acmeCertService: jest.Mocked<AcmeCertService>;

  beforeEach(async () => {
    adminService = {
      deleteUser: jest
        .fn()
        .mockResolvedValue({ success: true, message: 'User deleted' } as any),
      setMaintenanceMode: jest
        .fn()
        .mockResolvedValue({ success: true, maintenance: true } as any),
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

describe('AdminController - Dynamic Config API', () => {
  let controller: AdminController;
  let dynamicConfigService: DynamicConfigService;
  let adminService: Partial<AdminService>;

  beforeEach(async () => {
    adminService = {
      deleteUser: jest.fn().mockResolvedValue({ id: 'u1' } as any),
      setMaintenanceMode: jest
        .fn()
        .mockResolvedValue({ maintenanceMode: true } as any),
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
        DynamicConfigService,
      ],
    }).compile();

    controller = testingModule.get<AdminController>(AdminController);
    dynamicConfigService =
      testingModule.get<DynamicConfigService>(DynamicConfigService);
  });

  afterEach(async () => {
    await dynamicConfigService.stop();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all dynamic config parameters via GET /admin/config', () => {
    const config = controller.getAllConfig();
    expect(config.FEATURE_BATTLES_ENABLED).toBe(true);
    expect(config.ELO_K_FACTOR).toBe(32);
  });

  it('should get a single dynamic config parameter via GET /admin/config/:key', () => {
    const res = controller.getConfigKey('ELO_K_FACTOR');
    expect(res).toEqual({
      key: 'ELO_K_FACTOR',
      value: 32,
    });
  });

  it('should update dynamic config parameter via PUT /admin/config/:key', async () => {
    const res = await controller.updateConfig(
      'ELO_K_FACTOR',
      40,
      'super-admin',
    );
    expect(res.applied).toBe(true);
    expect(res.value).toBe(40);
    expect(controller.getConfigKey('ELO_K_FACTOR').value).toBe(40);
  });

  it('should retrieve audit logs via GET /admin/config/audit', async () => {
    await controller.updateConfig('FEATURE_BATTLES_ENABLED', false, 'ops-lead');

    const logs = controller.getConfigAuditLogs('10');
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].key).toBe('FEATURE_BATTLES_ENABLED');
    expect(logs[0].newValue).toBe(false);
    expect(logs[0].updatedBy).toBe('ops-lead');
    expect(logs[0].status).toBe('APPLIED');
  });
});
