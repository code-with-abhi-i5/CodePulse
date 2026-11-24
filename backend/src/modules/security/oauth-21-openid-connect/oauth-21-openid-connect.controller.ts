/**
 * @file oauth-21-openid-connect.controller.ts
 * @description REST API gateway and management endpoints for [SEC-PKCE-114]: OAuth 2.1 & OpenID Connect (OIDC) Identity Provider with Cryptographic PKCE Enforcement.
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
import { Oauth21OpenidConnectService } from './oauth-21-openid-connect.service';
import {
  Oauth21OpenidConnectConfig,
  Oauth21OpenidConnectRecord,
  Oauth21OpenidConnectMetricSnapshot,
  Oauth21OpenidConnectFilterQuery,
  Oauth21OpenidConnectHealthCheckResult,
  Oauth21OpenidConnectAuditEvent,
  Oauth21OpenidConnectBatchProcessResult,
  Oauth21OpenidConnectState,
  Oauth21OpenidConnectSeverity,
} from './oauth-21-openid-connect.types';

@Controller('api/v1/security/oauth-21-openid-connect')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class Oauth21OpenidConnectController {
  constructor(private readonly service: Oauth21OpenidConnectService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): Oauth21OpenidConnectHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): Oauth21OpenidConnectMetricSnapshot {
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
  public getConfig(): Oauth21OpenidConnectConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<Oauth21OpenidConnectConfig>,
    @Query('actor') actor = 'admin'
  ): Oauth21OpenidConnectConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<Oauth21OpenidConnectRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<Oauth21OpenidConnectBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): Oauth21OpenidConnectRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: Oauth21OpenidConnectState,
    @Query('severity') severity?: Oauth21OpenidConnectSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: Oauth21OpenidConnectRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): Oauth21OpenidConnectAuditEvent[] {
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
