/**
 * @file zombie-process-harvester.controller.ts
 * @description REST API gateway and management endpoints for [SANDBOX-CLEANUP-059]: Zombie Process Harvester & Subreaper Daemon with Zero Orphaned File Descriptor Leakage.
 * Exposes full CRUD, batch processing, telemetry metrics, and observability probes.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Header,
} from '@nestjs/common';
import { ZombieProcessHarvesterService } from './zombie-process-harvester.service';
import {
  ZombieProcessHarvesterConfig,
  ZombieProcessHarvesterRecord,
  ZombieProcessHarvesterMetricSnapshot,
  ZombieProcessHarvesterFilterQuery,
  ZombieProcessHarvesterHealthCheckResult,
  ZombieProcessHarvesterAuditEvent,
  ZombieProcessHarvesterBatchProcessResult,
  ZombieProcessHarvesterState,
  ZombieProcessHarvesterSeverity,
} from './zombie-process-harvester.types';

@Controller('api/v1/execution/zombie-process-harvester')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ZombieProcessHarvesterController {
  constructor(private readonly service: ZombieProcessHarvesterService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): ZombieProcessHarvesterHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): ZombieProcessHarvesterMetricSnapshot {
    return this.service.getMetricsSnapshot();
  }

  @Get('metrics/prometheus')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/plain')
  public getPrometheusMetrics(): string {
    return this.service.exportPrometheusMetrics();
  }

  @Get('config')
  @HttpCode(HttpStatus.OK)
  public getConfig(): ZombieProcessHarvesterConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<ZombieProcessHarvesterConfig>,
    @Query('actor') actor = 'admin'
  ): ZombieProcessHarvesterConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<ZombieProcessHarvesterRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<ZombieProcessHarvesterBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): ZombieProcessHarvesterRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: ZombieProcessHarvesterState,
    @Query('severity') severity?: ZombieProcessHarvesterSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: ZombieProcessHarvesterRecord[] } {
    return this.service.queryRecords({
      status,
      severity,
      tag,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      startDate: startDate ? Number(startDate) : undefined,
      endDate: endDate ? Number(endDate) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('audit')
  @HttpCode(HttpStatus.OK)
  public getAuditTrail(@Query('limit') limit = 100): ZombieProcessHarvesterAuditEvent[] {
    return this.service.getAuditTrail(Number(limit));
  }

  @Delete('purge')
  @HttpCode(HttpStatus.OK)
  public purge(
    @Query('olderThanMs') olderThanMs = 86400000,
    @Query('actor') actor = 'admin'
  ): { purged: number } {
    const purged = this.service.purge(Number(olderThanMs), actor);
    return { purged };
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  public reset(@Query('actor') actor = 'admin'): { message: string } {
    this.service.reset();
    return { message: 'Reset completed successfully by ' + actor };
  }

  
}
