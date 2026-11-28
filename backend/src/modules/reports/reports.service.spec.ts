import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsWorker } from './reports.worker';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFormat, ReportJobStatus, ReportScope } from '@prisma/client';

describe('ReportsService & Worker', () => {
  let service: ReportsService;
  let worker: ReportsWorker;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    battle: {
      count: jest.fn(),
    },
    challenge: {
      count: jest.fn(),
    },
    executiveReportJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'REPORTS_HMAC_SECRET') return 'test-reports-hmac-secret-32b';
      return null;
    }),
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'bullmq-job-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        ReportsWorker,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'BullQueue_reports-compilation', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    worker = module.get<ReportsWorker>(ReportsWorker);
  });

  describe('getSystemReport', () => {
    it('should aggregate platform counts and system health metrics', async () => {
      mockPrismaService.user.count.mockResolvedValue(1250);
      mockPrismaService.battle.count
        .mockResolvedValueOnce(540) // totalBattles
        .mockResolvedValueOnce(12); // activeBattles
      mockPrismaService.challenge.count
        .mockResolvedValueOnce(45) // totalChallenges
        .mockResolvedValueOnce(8); // activeChallenges

      const result = await service.getSystemReport();

      expect(result.systemStatus).toBe('Healthy');
      expect(result.metrics.totalUsers).toBe(1250);
      expect(result.metrics.totalBattles).toBe(540);
      expect(result.metrics.activeBattles).toBe(12);
      expect(result.metrics.totalChallenges).toBe(45);
      expect(result.metrics.activeChallenges).toBe(8);
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.memoryUsageMb).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createReportJob', () => {
    it('should create an individual report job and enqueue to BullMQ', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-123',
        organizationRole: 'MEMBER',
      });
      mockPrismaService.executiveReportJob.create.mockResolvedValue({
        id: 'job-999',
        requestedById: 'usr-123',
        scope: ReportScope.INDIVIDUAL,
        targetId: 'usr-123',
        format: ReportFormat.JSON,
        timeframeDays: 30,
        status: ReportJobStatus.PENDING,
      });

      const job = await service.createReportJob('usr-123', {
        scope: ReportScope.INDIVIDUAL,
        format: ReportFormat.JSON,
        timeframeDays: 30,
      });

      expect(job.id).toBe('job-999');
      expect(mockQueue.add).toHaveBeenCalledWith('compile-report', { jobId: 'job-999' });
    });

    it('should reject SYSTEM scope when requested by a non-admin member', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-regular',
        organizationRole: 'MEMBER',
      });

      await expect(
        service.createReportJob('usr-regular', {
          scope: ReportScope.SYSTEM,
          format: ReportFormat.CSV,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SYSTEM scope when requested by an ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-admin',
        organizationRole: 'ADMIN',
      });
      mockPrismaService.executiveReportJob.create.mockResolvedValue({
        id: 'job-admin-sys',
        requestedById: 'usr-admin',
        scope: ReportScope.SYSTEM,
        format: ReportFormat.CSV,
        timeframeDays: 30,
        status: ReportJobStatus.PENDING,
      });

      const job = await service.createReportJob('usr-admin', {
        scope: ReportScope.SYSTEM,
        format: ReportFormat.CSV,
      });

      expect(job.id).toBe('job-admin-sys');
    });
  });

  describe('processReportJob', () => {
    it('should process JSON individual report with SHA-256 HMAC and token', async () => {
      const mockJob = {
        id: 'job-100',
        requestedById: 'usr-1',
        targetId: 'usr-1',
        scope: ReportScope.INDIVIDUAL,
        format: ReportFormat.JSON,
        timeframeDays: 30,
        status: ReportJobStatus.PENDING,
      };

      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.executiveReportJob.update.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        username: 'alice_dev',
        name: 'Alice Developer',
        company: 'CodePulse Inc',
        rating: { overall: 1650, tier: 'GOLD' },
        stats: { totalCommits: 320, totalPRs: 25 },
        languages: [{ name: 'TypeScript', color: '#3178c6' }],
        wonBattles: [{ id: 'b1' }, { id: 'b2' }],
        challenges: [{ id: 'c1' }],
      });

      const result = await service.processReportJob('job-100');

      expect(result.format).toBe(ReportFormat.JSON);
      expect(result.fileName).toMatch(/\.json$/);
      expect(result.checksum).toBeDefined();
      expect(result.checksum.length).toBe(64); // SHA-256 hex string

      expect(mockPrismaService.executiveReportJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-100' },
          data: expect.objectContaining({
            status: ReportJobStatus.COMPLETED,
            sha256Checksum: result.checksum,
          }),
        }),
      );
    });

    it('should compile CSV formatted reports accurately', async () => {
      const mockJob = {
        id: 'job-csv',
        requestedById: 'usr-1',
        targetId: 'usr-1',
        scope: ReportScope.INDIVIDUAL,
        format: ReportFormat.CSV,
        timeframeDays: 14,
        status: ReportJobStatus.PENDING,
      };

      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.executiveReportJob.update.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        username: 'bob_coder',
        languages: [],
        wonBattles: [],
        challenges: [],
      });

      const result = await service.processReportJob('job-csv');
      expect(result.format).toBe(ReportFormat.CSV);
      expect(result.fileName).toMatch(/\.csv$/);
      const content = result.buffer.toString('utf-8');
      expect(content).toContain('metric_key,metric_value');
      expect(content).toContain('bob_coder');
    });

    it('should compile valid PDF formatted reports', async () => {
      const mockJob = {
        id: 'job-pdf',
        requestedById: 'usr-admin',
        scope: ReportScope.SYSTEM,
        format: ReportFormat.PDF,
        timeframeDays: 30,
        status: ReportJobStatus.PENDING,
      };

      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.executiveReportJob.update.mockResolvedValue({});
      mockPrismaService.user.count.mockResolvedValue(500);
      mockPrismaService.battle.count.mockResolvedValue(120);
      mockPrismaService.challenge.count.mockResolvedValue(30);

      const result = await service.processReportJob('job-pdf');
      expect(result.format).toBe(ReportFormat.PDF);
      expect(result.fileName).toMatch(/\.pdf$/);
      const content = result.buffer.toString('utf-8');
      expect(content.startsWith('%PDF-1.4')).toBe(true);
    });
  });

  describe('downloadReport', () => {
    it('should throw 404 for invalid token', async () => {
      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue(null);

      await expect(service.downloadReport('non-existent-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 410 Gone for expired token', async () => {
      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue({
        id: 'job-expired',
        tokenExpiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        status: ReportJobStatus.COMPLETED,
      });

      await expect(service.downloadReport('expired-token')).rejects.toThrow(
        HttpException,
      );
    });

    it('should deliver stream for valid active download token', async () => {
      mockPrismaService.executiveReportJob.findUnique.mockResolvedValue({
        id: 'job-active',
        requestedById: 'usr-1',
        targetId: 'usr-1',
        scope: ReportScope.INDIVIDUAL,
        format: ReportFormat.JSON,
        timeframeDays: 30,
        status: ReportJobStatus.COMPLETED,
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // In 1 hour
        sha256Checksum: 'valid-checksum-hash',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        username: 'active_dev',
        languages: [],
        wonBattles: [],
        challenges: [],
      });

      const artifact = await service.downloadReport('active-token');
      expect(artifact.checksum).toBe('valid-checksum-hash');
      expect(artifact.fileName).toContain('job-acti');
      expect(artifact.stream).toBeDefined();
    });
  });

  describe('ReportsWorker', () => {
    it('should process job from BullMQ and return completion metadata', async () => {
      const spy = jest
        .spyOn(service, 'processReportJob')
        .mockResolvedValue({
          stream: null as any,
          buffer: Buffer.from('test'),
          checksum: 'worker-checksum-123',
          format: ReportFormat.JSON,
          fileName: 'report.json',
        });

      const result = await worker.process({
        data: { jobId: 'job-worker-1' },
      } as any);

      expect(spy).toHaveBeenCalledWith('job-worker-1');
      expect(result.checksum).toBe('worker-checksum-123');
      expect(result.format).toBe(ReportFormat.JSON);
    });
  });
});
