/**
 * @file turn-server-pool-allocator.controller.ts
 * @description REST API gateway and management endpoints for [NET-TURN-093]: Automated Coturn STUN/TURN Server Pool Allocator with Geo-DNS Health Probing.
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
import { TurnServerPoolAllocatorService } from './turn-server-pool-allocator.service';
import {
  TurnServerPoolAllocatorConfig,
  TurnServerPoolAllocatorRecord,
  TurnServerPoolAllocatorMetricSnapshot,
  TurnServerPoolAllocatorFilterQuery,
  TurnServerPoolAllocatorHealthCheckResult,
  TurnServerPoolAllocatorAuditEvent,
  TurnServerPoolAllocatorBatchProcessResult,
  TurnServerPoolAllocatorState,
  TurnServerPoolAllocatorSeverity,
} from './turn-server-pool-allocator.types';

@Controller('api/v1/network/turn-server-pool-allocator')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TurnServerPoolAllocatorController {
  constructor(private readonly service: TurnServerPoolAllocatorService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): TurnServerPoolAllocatorHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): TurnServerPoolAllocatorMetricSnapshot {
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
  public getConfig(): TurnServerPoolAllocatorConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<TurnServerPoolAllocatorConfig>,
    @Query('actor') actor = 'admin'
  ): TurnServerPoolAllocatorConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<TurnServerPoolAllocatorRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<TurnServerPoolAllocatorBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): TurnServerPoolAllocatorRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: TurnServerPoolAllocatorState,
    @Query('severity') severity?: TurnServerPoolAllocatorSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: TurnServerPoolAllocatorRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): TurnServerPoolAllocatorAuditEvent[] {
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
