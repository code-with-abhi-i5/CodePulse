/**
 * @file endtoend-exactlyonce-processing-engine.controller.ts
 * @description REST API gateway and management endpoints for [EVENT-EXACTLY-ONCE-126]: End-to-End Exactly-Once Processing Engine with Distributed State Machine Deduplication.
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
import { EndtoendExactlyonceProcessingEngineService } from './endtoend-exactlyonce-processing-engine.service';
import {
  EndtoendExactlyonceProcessingEngineConfig,
  EndtoendExactlyonceProcessingEngineRecord,
  EndtoendExactlyonceProcessingEngineMetricSnapshot,
  EndtoendExactlyonceProcessingEngineFilterQuery,
  EndtoendExactlyonceProcessingEngineHealthCheckResult,
  EndtoendExactlyonceProcessingEngineAuditEvent,
  EndtoendExactlyonceProcessingEngineBatchProcessResult,
  EndtoendExactlyonceProcessingEngineState,
  EndtoendExactlyonceProcessingEngineSeverity,
} from './endtoend-exactlyonce-processing-engine.types';

@Controller('api/v1/events/endtoend-exactlyonce-processing-engine')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EndtoendExactlyonceProcessingEngineController {
  constructor(private readonly service: EndtoendExactlyonceProcessingEngineService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): EndtoendExactlyonceProcessingEngineHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): EndtoendExactlyonceProcessingEngineMetricSnapshot {
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
  public getConfig(): EndtoendExactlyonceProcessingEngineConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<EndtoendExactlyonceProcessingEngineConfig>,
    @Query('actor') actor = 'admin'
  ): EndtoendExactlyonceProcessingEngineConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<EndtoendExactlyonceProcessingEngineRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<EndtoendExactlyonceProcessingEngineBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): EndtoendExactlyonceProcessingEngineRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: EndtoendExactlyonceProcessingEngineState,
    @Query('severity') severity?: EndtoendExactlyonceProcessingEngineSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: EndtoendExactlyonceProcessingEngineRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): EndtoendExactlyonceProcessingEngineAuditEvent[] {
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
