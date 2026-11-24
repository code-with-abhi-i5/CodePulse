/**
 * @file webauthn-fido2-passkey-server.controller.ts
 * @description REST API gateway and management endpoints for [SEC-PASSKEY-107]: WebAuthn / FIDO2 Passkey Server with Cryptographic Biometric Challenge Verification.
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
import { WebauthnFido2PasskeyServerService } from './webauthn-fido2-passkey-server.service';
import {
  WebauthnFido2PasskeyServerConfig,
  WebauthnFido2PasskeyServerRecord,
  WebauthnFido2PasskeyServerMetricSnapshot,
  WebauthnFido2PasskeyServerFilterQuery,
  WebauthnFido2PasskeyServerHealthCheckResult,
  WebauthnFido2PasskeyServerAuditEvent,
  WebauthnFido2PasskeyServerBatchProcessResult,
  WebauthnFido2PasskeyServerState,
  WebauthnFido2PasskeyServerSeverity,
} from './webauthn-fido2-passkey-server.types';

@Controller('api/v1/security/webauthn-fido2-passkey-server')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WebauthnFido2PasskeyServerController {
  constructor(private readonly service: WebauthnFido2PasskeyServerService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): WebauthnFido2PasskeyServerHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): WebauthnFido2PasskeyServerMetricSnapshot {
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
  public getConfig(): WebauthnFido2PasskeyServerConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<WebauthnFido2PasskeyServerConfig>,
    @Query('actor') actor = 'admin'
  ): WebauthnFido2PasskeyServerConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<WebauthnFido2PasskeyServerRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<WebauthnFido2PasskeyServerBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): WebauthnFido2PasskeyServerRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: WebauthnFido2PasskeyServerState,
    @Query('severity') severity?: WebauthnFido2PasskeyServerSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: WebauthnFido2PasskeyServerRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): WebauthnFido2PasskeyServerAuditEvent[] {
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
