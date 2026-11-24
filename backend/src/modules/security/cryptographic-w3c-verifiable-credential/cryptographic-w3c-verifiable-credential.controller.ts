/**
 * @file cryptographic-w3c-verifiable-credential.controller.ts
 * @description REST API gateway and management endpoints for [SEC-VC-BADGE-112]: Cryptographic W3C Verifiable Credential Badge Exporter with ECDSA Signatures & QR Code.
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
import { CryptographicW3cVerifiableCredentialService } from './cryptographic-w3c-verifiable-credential.service';
import {
  CryptographicW3cVerifiableCredentialConfig,
  CryptographicW3cVerifiableCredentialRecord,
  CryptographicW3cVerifiableCredentialMetricSnapshot,
  CryptographicW3cVerifiableCredentialFilterQuery,
  CryptographicW3cVerifiableCredentialHealthCheckResult,
  CryptographicW3cVerifiableCredentialAuditEvent,
  CryptographicW3cVerifiableCredentialBatchProcessResult,
  CryptographicW3cVerifiableCredentialState,
  CryptographicW3cVerifiableCredentialSeverity,
} from './cryptographic-w3c-verifiable-credential.types';

@Controller('api/v1/security/cryptographic-w3c-verifiable-credential')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CryptographicW3cVerifiableCredentialController {
  constructor(private readonly service: CryptographicW3cVerifiableCredentialService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): CryptographicW3cVerifiableCredentialHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): CryptographicW3cVerifiableCredentialMetricSnapshot {
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
  public getConfig(): CryptographicW3cVerifiableCredentialConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<CryptographicW3cVerifiableCredentialConfig>,
    @Query('actor') actor = 'admin'
  ): CryptographicW3cVerifiableCredentialConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<CryptographicW3cVerifiableCredentialRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<CryptographicW3cVerifiableCredentialBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): CryptographicW3cVerifiableCredentialRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: CryptographicW3cVerifiableCredentialState,
    @Query('severity') severity?: CryptographicW3cVerifiableCredentialSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: CryptographicW3cVerifiableCredentialRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): CryptographicW3cVerifiableCredentialAuditEvent[] {
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
