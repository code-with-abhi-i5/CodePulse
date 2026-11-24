/**
 * @file cryptographic-hmacsha256-webhook-signer.controller.ts
 * @description REST API gateway and management endpoints for [SEC-HMAC-WEBHOOK-118]: Cryptographic HMAC-SHA256 Webhook Signer with Timestamp Replay Attack Prevention.
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
import { CryptographicHmacsha256WebhookSignerService } from './cryptographic-hmacsha256-webhook-signer.service';
import {
  CryptographicHmacsha256WebhookSignerConfig,
  CryptographicHmacsha256WebhookSignerRecord,
  CryptographicHmacsha256WebhookSignerMetricSnapshot,
  CryptographicHmacsha256WebhookSignerFilterQuery,
  CryptographicHmacsha256WebhookSignerHealthCheckResult,
  CryptographicHmacsha256WebhookSignerAuditEvent,
  CryptographicHmacsha256WebhookSignerBatchProcessResult,
  CryptographicHmacsha256WebhookSignerState,
  CryptographicHmacsha256WebhookSignerSeverity,
} from './cryptographic-hmacsha256-webhook-signer.types';

@Controller('api/v1/security/cryptographic-hmacsha256-webhook-signer')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CryptographicHmacsha256WebhookSignerController {
  constructor(private readonly service: CryptographicHmacsha256WebhookSignerService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): CryptographicHmacsha256WebhookSignerHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): CryptographicHmacsha256WebhookSignerMetricSnapshot {
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
  public getConfig(): CryptographicHmacsha256WebhookSignerConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<CryptographicHmacsha256WebhookSignerConfig>,
    @Query('actor') actor = 'admin'
  ): CryptographicHmacsha256WebhookSignerConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<CryptographicHmacsha256WebhookSignerRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<CryptographicHmacsha256WebhookSignerBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): CryptographicHmacsha256WebhookSignerRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: CryptographicHmacsha256WebhookSignerState,
    @Query('severity') severity?: CryptographicHmacsha256WebhookSignerSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: CryptographicHmacsha256WebhookSignerRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): CryptographicHmacsha256WebhookSignerAuditEvent[] {
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
