import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReportsService } from './reports.service';

@Processor('reports-compilation')
export class ReportsWorker extends WorkerHost {
  private readonly logger = new Logger(ReportsWorker.name);

  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(job: Job<{ jobId: string }>): Promise<any> {
    this.logger.log(`Starting BullMQ processing for report job ${job.data?.jobId}`);
    if (!job.data?.jobId) {
      throw new Error('Missing jobId in report compilation job data');
    }

    const artifact = await this.reportsService.processReportJob(job.data.jobId);
    this.logger.log(
      `Successfully compiled report job ${job.data.jobId} (Checksum: ${artifact.checksum})`,
    );

    return {
      jobId: job.data.jobId,
      checksum: artifact.checksum,
      format: artifact.format,
      fileName: artifact.fileName,
    };
  }
}
