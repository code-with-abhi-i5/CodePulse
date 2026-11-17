import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DynamicConfigService } from '../../config/dynamic-config.service';

describe('AdminController - Dynamic Config API', () => {
  let controller: AdminController;
  let dynamicConfigService: DynamicConfigService;
  let adminService: Partial<AdminService>;

  beforeEach(async () => {
    adminService = {
      deleteUser: jest.fn().mockResolvedValue({ id: 'u1' }),
      setMaintenanceMode: jest
        .fn()
        .mockResolvedValue({ maintenanceMode: true }),
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
