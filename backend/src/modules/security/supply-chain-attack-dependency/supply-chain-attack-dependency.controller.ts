/**
 * @file supply-chain-attack-dependency.controller.ts
 * @description REST API gateway and management endpoints for [SEC-TYPOSQUAT-113]: Supply Chain Attack & Dependency Typosquatting Scanner with Shannon Entropy Analyzer.
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
import { SupplyChainAttackDependencyService } from './supply-chain-attack-dependency.service';
import {
  SupplyChainAttackDependencyConfig,
  SupplyChainAttackDependencyRecord,
  SupplyChainAttackDependencyMetricSnapshot,
  SupplyChainAttackDependencyFilterQuery,
  SupplyChainAttackDependencyHealthCheckResult,
  SupplyChainAttackDependencyAuditEvent,
  SupplyChainAttackDependencyBatchProcessResult,
  SupplyChainAttackDependencyState,
  SupplyChainAttackDependencySeverity,
} from './supply-chain-attack-dependency.types';

@Controller('api/v1/security/supply-chain-attack-dependency')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SupplyChainAttackDependencyController {
  constructor(private readonly service: SupplyChainAttackDependencyService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): SupplyChainAttackDependencyHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): SupplyChainAttackDependencyMetricSnapshot {
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
  public getConfig(): SupplyChainAttackDependencyConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<SupplyChainAttackDependencyConfig>,
    @Query('actor') actor = 'admin'
  ): SupplyChainAttackDependencyConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<SupplyChainAttackDependencyRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<SupplyChainAttackDependencyBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): SupplyChainAttackDependencyRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: SupplyChainAttackDependencyState,
    @Query('severity') severity?: SupplyChainAttackDependencySeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: SupplyChainAttackDependencyRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): SupplyChainAttackDependencyAuditEvent[] {
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
