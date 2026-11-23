/**
 * @file bug-reproduction-synthesizer.controller.ts
 * @description REST API gateway and management endpoints for [AI-REPRO-066]: Automated Bug Reproduction Script Synthesizer from Unstructured GitHub Issues.
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
import { BugReproductionSynthesizerService } from './bug-reproduction-synthesizer.service';
import {
  BugReproductionSynthesizerConfig,
  BugReproductionSynthesizerRecord,
  BugReproductionSynthesizerMetricSnapshot,
  BugReproductionSynthesizerFilterQuery,
  BugReproductionSynthesizerHealthCheckResult,
  BugReproductionSynthesizerAuditEvent,
  BugReproductionSynthesizerBatchProcessResult,
  BugReproductionSynthesizerState,
  BugReproductionSynthesizerSeverity,
} from './bug-reproduction-synthesizer.types';

@Controller('api/v1/ai/bug-reproduction-synthesizer')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BugReproductionSynthesizerController {
  constructor(private readonly service: BugReproductionSynthesizerService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): BugReproductionSynthesizerHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): BugReproductionSynthesizerMetricSnapshot {
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
  public getConfig(): BugReproductionSynthesizerConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<BugReproductionSynthesizerConfig>,
    @Query('actor') actor = 'admin'
  ): BugReproductionSynthesizerConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<BugReproductionSynthesizerRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<BugReproductionSynthesizerBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): BugReproductionSynthesizerRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: BugReproductionSynthesizerState,
    @Query('severity') severity?: BugReproductionSynthesizerSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: BugReproductionSynthesizerRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): BugReproductionSynthesizerAuditEvent[] {
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
