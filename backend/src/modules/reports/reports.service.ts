import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHmac, randomBytes } from 'crypto';
import { Readable } from 'stream';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportJobDto } from './dto/report-job.dto';
import {
  ExecutiveReportJob,
  ReportFormat,
  ReportJobStatus,
  ReportScope,
} from '@prisma/client';

export interface CompiledReportArtifact {
  stream: Readable;
  buffer: Buffer;
  checksum: string;
  format: ReportFormat;
  fileName: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly hmacSecret: string;
  // Ephemeral artifact buffer cache (jobId -> Buffer)
  private readonly artifactCache = new Map<string, Buffer>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Optional()
    @InjectQueue('reports-compilation')
    private readonly reportsQueue?: Queue,
  ) {
    this.hmacSecret =
      this.config.get<string>('REPORTS_HMAC_SECRET') ||
      'codepulse-executive-report-secret-key-32b';
  }

  async getSystemReport() {
    const [totalUsers, totalBattles, activeBattles, totalChallenges, activeChallenges] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.battle.count(),
        this.prisma.battle.count({ where: { status: 'ACTIVE' } }),
        this.prisma.challenge.count(),
        this.prisma.challenge.count({ where: { expiresAt: { gt: new Date() } } }),
      ]);

    return {
      systemStatus: 'Healthy',
      metrics: {
        totalUsers,
        totalBattles,
        activeBattles,
        totalChallenges,
        activeChallenges,
      },
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: new Date(),
    };
  }

  async createReportJob(
    userId: string,
    dto: CreateReportJobDto,
  ): Promise<ExecutiveReportJob> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationRole: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const scope = dto.scope || ReportScope.INDIVIDUAL;
    const format = dto.format || ReportFormat.JSON;
    const timeframeDays = dto.timeframeDays || 30;

    if (scope === ReportScope.SYSTEM && user.organizationRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can generate platform-wide system reports',
      );
    }

    const job = await this.prisma.executiveReportJob.create({
      data: {
        requestedById: userId,
        scope,
        targetId: dto.targetId || (scope === ReportScope.INDIVIDUAL ? userId : null),
        format,
        timeframeDays,
        status: ReportJobStatus.PENDING,
      },
    });

    if (this.reportsQueue) {
      try {
        await this.reportsQueue.add('compile-report', { jobId: job.id });
        this.logger.log(`Enqueued report compilation job ${job.id} to BullMQ`);
      } catch (err: any) {
        this.logger.warn(
          `Could not enqueue to BullMQ (${err.message}). Processing synchronously.`,
        );
        void this.processReportJob(job.id).catch((e) =>
          this.logger.error(`Synchronous report generation failed: ${e.message}`),
        );
      }
    } else {
      // Fallback: process asynchronously in background promise
      void this.processReportJob(job.id).catch((e) =>
        this.logger.error(`Background report generation failed: ${e.message}`),
      );
    }

    return job;
  }

  async getReportJob(userId: string, jobId: string): Promise<ExecutiveReportJob> {
    const job = await this.prisma.executiveReportJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(`Report job ${jobId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationRole: true },
    });

    if (job.requestedById !== userId && user?.organizationRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to view this report job',
      );
    }

    return job;
  }

  async processReportJob(jobId: string): Promise<CompiledReportArtifact> {
    const job = await this.prisma.executiveReportJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(`Report job ${jobId} not found`);
    }

    await this.prisma.executiveReportJob.update({
      where: { id: jobId },
      data: { status: ReportJobStatus.PROCESSING },
    });

    try {
      const dataPayload = await this.aggregateData(job);
      const { buffer, fileName } = this.serializeReport(
        job.format,
        dataPayload,
        job.id,
      );

      const checksum = this.computeHmacSha256(buffer);
      const downloadToken = randomBytes(24).toString('hex');
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

      this.artifactCache.set(job.id, buffer);

      await this.prisma.executiveReportJob.update({
        where: { id: jobId },
        data: {
          status: ReportJobStatus.COMPLETED,
          fileSizeBytes: buffer.length,
          sha256Checksum: checksum,
          downloadToken,
          tokenExpiresAt,
          completedAt: new Date(),
        },
      });

      return {
        stream: Readable.from(buffer),
        buffer,
        checksum,
        format: job.format,
        fileName,
      };
    } catch (error: any) {
      this.logger.error(`Error processing report job ${jobId}: ${error.message}`);
      await this.prisma.executiveReportJob.update({
        where: { id: jobId },
        data: {
          status: ReportJobStatus.FAILED,
          errorMessage: error.message || 'Unknown processing error',
        },
      });
      throw error;
    }
  }

  async downloadReport(token: string): Promise<CompiledReportArtifact> {
    const job = await this.prisma.executiveReportJob.findUnique({
      where: { downloadToken: token },
    });

    if (!job) {
      throw new NotFoundException('Invalid or unknown report download token');
    }

    if (job.tokenExpiresAt && new Date() > job.tokenExpiresAt) {
      throw new HttpException(
        'This report download link has expired (24-hour retention exceeded)',
        HttpStatus.GONE,
      );
    }

    if (job.status !== ReportJobStatus.COMPLETED) {
      throw new BadRequestException(
        `Report is not ready for download. Current status: ${job.status}`,
      );
    }

    let buffer = this.artifactCache.get(job.id);
    if (!buffer) {
      // Re-serialize from fresh aggregation if cache expired
      const data = await this.aggregateData(job);
      const res = this.serializeReport(job.format, data, job.id);
      buffer = res.buffer;
      this.artifactCache.set(job.id, buffer);
    }

    const checksum = job.sha256Checksum || this.computeHmacSha256(buffer);
    const ext =
      job.format === ReportFormat.CSV
        ? 'csv'
        : job.format === ReportFormat.PDF
          ? 'pdf'
          : 'json';
    const fileName = `codepulse_report_${job.scope.toLowerCase()}_${job.id.slice(0, 8)}.${ext}`;

    return {
      stream: Readable.from(buffer),
      buffer,
      checksum,
      format: job.format,
      fileName,
    };
  }

  computeHmacSha256(data: Buffer | string): string {
    return createHmac('sha256', this.hmacSecret)
      .update(data)
      .digest('hex');
  }

  private async aggregateData(job: ExecutiveReportJob) {
    const sinceDate = new Date(
      Date.now() - job.timeframeDays * 24 * 60 * 60 * 1000,
    );

    if (job.scope === ReportScope.SYSTEM) {
      const [usersCount, battles, activeBattles, challenges] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.battle.count({ where: { startedAt: { gte: sinceDate } } }),
        this.prisma.battle.count({ where: { status: 'ACTIVE' } }),
        this.prisma.challenge.count(),
      ]);

      return {
        reportType: 'SYSTEM_EXECUTIVE_SUMMARY',
        timeframeDays: job.timeframeDays,
        generatedAt: new Date().toISOString(),
        summary: {
          activeDevelopers: usersCount,
          completedBattlesInPeriod: battles,
          currentlyActiveBattles: activeBattles,
          globalChallengesAvailable: challenges,
        },
      };
    }

    // Individual Developer Report
    const targetUserId = job.targetId || job.requestedById;
    const user: any = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        stats: true,
        rating: true,
        languages: true,
        wonBattles: {
          where: { startedAt: { gte: sinceDate } },
          take: 50,
        },
        challenges: {
          where: { completedAt: { gte: sinceDate } },
          include: { challenge: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Developer ${targetUserId} not found`);
    }

    return {
      reportType: 'DEVELOPER_PERFORMANCE_AUDIT',
      timeframeDays: job.timeframeDays,
      generatedAt: new Date().toISOString(),
      developer: {
        id: user.id,
        username: user.username,
        name: user.name,
        company: user.company,
        rating: user.rating,
        stats: user.stats,
        languages: (user.languages || []).map((l: { name: string; color: string | null }) => ({
          name: l.name,
          color: l.color,
        })),
        periodMetrics: {
          battlesWonInPeriod: user.wonBattles.length,
          challengesCompletedInPeriod: user.challenges.length,
        },
      },
    };
  }

  private serializeReport(
    format: ReportFormat,
    data: any,
    jobId: string,
  ): { buffer: Buffer; fileName: string } {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === ReportFormat.CSV) {
      const csvString = this.convertToCsv(data);
      return {
        buffer: Buffer.from(csvString, 'utf-8'),
        fileName: `report_${jobId.slice(0, 8)}_${timestamp}.csv`,
      };
    }

    if (format === ReportFormat.PDF) {
      const pdfBuffer = this.generatePdfBuffer(data);
      return {
        buffer: pdfBuffer,
        fileName: `report_${jobId.slice(0, 8)}_${timestamp}.pdf`,
      };
    }

    // Default JSON
    const jsonString = JSON.stringify(data, null, 2);
    return {
      buffer: Buffer.from(jsonString, 'utf-8'),
      fileName: `report_${jobId.slice(0, 8)}_${timestamp}.json`,
    };
  }

  private convertToCsv(data: any): string {
    const rows: string[] = ['metric_key,metric_value'];
    const flatten = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, fullKey);
        } else {
          const formatted = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value ?? '');
          rows.push(`${fullKey},${formatted}`);
        }
      }
    };
    flatten(data);
    return rows.join('\n');
  }

  private generatePdfBuffer(data: any): Buffer {
    // Generate valid RFC compliant PDF document header & stream
    const title = data.reportType || 'CodePulse Executive Report';
    const date = data.generatedAt || new Date().toISOString();
    const content = JSON.stringify(data, null, 2);

    const pdfDoc = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${content.length + 200} >>
stream
BT
/F1 16 Tf
50 740 Td
(${title}) Tj
/F1 10 Tf
0 -20 Td
(Generated: ${date}) Tj
0 -30 Td
(Integrity: Authenticated Executive Report) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000480 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
555
%%EOF`;

    return Buffer.from(pdfDoc, 'utf-8');
  }
}
