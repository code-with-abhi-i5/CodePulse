/**
 * @file semantic-changelog-generator.controller.ts
 * @description REST API gateway and management endpoints for [AI-CHANGELOG-078]: Semantic Git Commit Clustering & Automated Human-Centric Release Notes Generator.
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
import { SemanticChangelogGeneratorService } from './semantic-changelog-generator.service';
import {
  SemanticChangelogGeneratorConfig,
  SemanticChangelogGeneratorRecord,
  SemanticChangelogGeneratorMetricSnapshot,
  SemanticChangelogGeneratorFilterQuery,
  SemanticChangelogGeneratorHealthCheckResult,
  SemanticChangelogGeneratorAuditEvent,
  SemanticChangelogGeneratorBatchProcessResult,
  SemanticChangelogGeneratorState,
  SemanticChangelogGeneratorSeverity,
} from './semantic-changelog-generator.types';

@Controller('api/v1/ai/semantic-changelog-generator')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SemanticChangelogGeneratorController {
  constructor(private readonly service: SemanticChangelogGeneratorService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): SemanticChangelogGeneratorHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): SemanticChangelogGeneratorMetricSnapshot {
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
  public getConfig(): SemanticChangelogGeneratorConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<SemanticChangelogGeneratorConfig>,
    @Query('actor') actor = 'admin'
  ): SemanticChangelogGeneratorConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<SemanticChangelogGeneratorRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<SemanticChangelogGeneratorBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): SemanticChangelogGeneratorRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: SemanticChangelogGeneratorState,
    @Query('severity') severity?: SemanticChangelogGeneratorSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: SemanticChangelogGeneratorRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): SemanticChangelogGeneratorAuditEvent[] {
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
