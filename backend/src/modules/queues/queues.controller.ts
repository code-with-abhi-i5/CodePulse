import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  Optional,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueuesAdminGuard } from './queues-admin.guard';
import { DeadLetterQueueService } from './dlq.service';
import { QueueManagerService } from './queue-manager.service';

@ApiTags('admin-queues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, QueuesAdminGuard)
@Controller('admin/queues')
export class QueuesController {
  constructor(
    private readonly dlq: DeadLetterQueueService,
    @Optional() private readonly queueManager?: QueueManagerService,
  ) {}

  @Post('dlq/replay')
  @ApiOperation({ summary: 'Replay dead letter queue messages' })
  replay(@Body() body: { ids?: unknown }) {
    return this.dlq.replay(body?.ids);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Export queue metrics in Prometheus exposition format' })
  async metrics(@Res() response: Response) {
    // Send directly so the global JSON-envelope interceptor does not wrap metrics.
    const dlqMetrics = await this.dlq.metrics();
    const shardedMetrics = this.queueManager
      ? await this.queueManager.exportPrometheusMetrics()
      : '';
    response
      .type('text/plain; version=0.0.4')
      .send(`${dlqMetrics}\n${shardedMetrics}`.trim());
  }

  @Get('shards/status')
  @ApiOperation({ summary: 'Retrieve health, concurrency, and backlog metrics for all queue shards (#372)' })
  async getShardsStatus() {
    return this.queueManager ? this.queueManager.getAllShardsStatus() : [];
  }

  @Post(':queueName/pause')
  @ApiOperation({ summary: 'Pause a specific queue shard (#372)' })
  @ApiParam({ name: 'queueName', description: 'Queue shard identifier or alias' })
  async pauseQueue(@Param('queueName') queueName: string) {
    if (!this.queueManager) return { paused: false };
    return this.queueManager.pauseQueue(queueName);
  }

  @Post(':queueName/resume')
  @ApiOperation({ summary: 'Resume a specific queue shard (#372)' })
  @ApiParam({ name: 'queueName', description: 'Queue shard identifier or alias' })
  async resumeQueue(@Param('queueName') queueName: string) {
    if (!this.queueManager) return { resumed: false };
    return this.queueManager.resumeQueue(queueName);
  }

  @Post(':queueName/clear')
  @ApiOperation({ summary: 'Clear waiting/delayed jobs in a queue shard (#372)' })
  @ApiParam({ name: 'queueName', description: 'Queue shard identifier or alias' })
  async clearQueue(@Param('queueName') queueName: string) {
    if (!this.queueManager) return { cleared: false };
    return this.queueManager.clearQueue(queueName);
  }

  @Post(':queueName/scale')
  @ApiOperation({ summary: 'Dynamically scale worker concurrency for a queue shard (#372)' })
  @ApiParam({ name: 'queueName', description: 'Queue shard identifier or alias' })
  async scaleQueue(
    @Param('queueName') queueName: string,
    @Body() body: { concurrency: number },
  ) {
    if (!this.queueManager) return { scaled: false };
    return this.queueManager.scaleWorker(queueName, Number(body.concurrency));
  }
}
