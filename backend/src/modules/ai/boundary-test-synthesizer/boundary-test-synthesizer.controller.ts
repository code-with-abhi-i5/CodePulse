/**
 * @file boundary-test-synthesizer.controller.ts
 * @description REST API gateway and management endpoints for [AI-TESTGEN-064]: Dynamic Boundary Condition Test Suite Synthesizer with Coverage-Guided Fuzzing.
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
import { BoundaryTestSynthesizerService } from './boundary-test-synthesizer.service';
import {
  BoundaryTestSynthesizerConfig,
  BoundaryTestSynthesizerRecord,
  BoundaryTestSynthesizerMetricSnapshot,
  BoundaryTestSynthesizerFilterQuery,
  BoundaryTestSynthesizerHealthCheckResult,
  BoundaryTestSynthesizerAuditEvent,
  BoundaryTestSynthesizerBatchProcessResult,
  BoundaryTestSynthesizerState,
  BoundaryTestSynthesizerSeverity,
} from './boundary-test-synthesizer.types';

@Controller('api/v1/ai/boundary-test-synthesizer')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BoundaryTestSynthesizerController {
  constructor(private readonly service: BoundaryTestSynthesizerService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): BoundaryTestSynthesizerHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): BoundaryTestSynthesizerMetricSnapshot {
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
  public getConfig(): BoundaryTestSynthesizerConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<BoundaryTestSynthesizerConfig>,
    @Query('actor') actor = 'admin'
  ): BoundaryTestSynthesizerConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<BoundaryTestSynthesizerRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<BoundaryTestSynthesizerBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): BoundaryTestSynthesizerRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: BoundaryTestSynthesizerState,
    @Query('severity') severity?: BoundaryTestSynthesizerSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: BoundaryTestSynthesizerRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): BoundaryTestSynthesizerAuditEvent[] {
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
