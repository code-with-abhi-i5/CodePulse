/**
 * @file webrtc-sfu-mesh.controller.ts
 * @description REST API gateway and management endpoints for [NET-SFU-087]: Selective Forwarding Unit (SFU) WebRTC Mesh for Multi-Player Voice Chat & Screen-Sharing.
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
import { WebRtcSfuMeshService } from './webrtc-sfu-mesh.service';
import {
  WebRtcSfuMeshConfig,
  WebRtcSfuMeshRecord,
  WebRtcSfuMeshMetricSnapshot,
  WebRtcSfuMeshFilterQuery,
  WebRtcSfuMeshHealthCheckResult,
  WebRtcSfuMeshAuditEvent,
  WebRtcSfuMeshBatchProcessResult,
  WebRtcSfuMeshState,
  WebRtcSfuMeshSeverity,
} from './webrtc-sfu-mesh.types';

@Controller('api/v1/network/webrtc-sfu-mesh')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WebRtcSfuMeshController {
  constructor(private readonly service: WebRtcSfuMeshService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  public getHealth(): WebRtcSfuMeshHealthCheckResult {
    return this.service.getHealth();
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  public getMetrics(): WebRtcSfuMeshMetricSnapshot {
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
  public getConfig(): WebRtcSfuMeshConfig {
    return this.service.getConfig();
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  public updateConfig(
    @Body() body: Partial<WebRtcSfuMeshConfig>,
    @Query('actor') actor = 'admin'
  ): WebRtcSfuMeshConfig {
    return this.service.updateConfig(body, actor);
  }

  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  public async submitRecord(
    @Body() payload: Record<string, unknown>,
    @Query('actor') actor = 'client',
    @Query('tags') tags?: string
  ): Promise<WebRtcSfuMeshRecord> {
    const tagArray = tags ? tags.split(',') : [];
    return this.service.processRecord(payload, actor, tagArray);
  }

  @Post('records/batch')
  @HttpCode(HttpStatus.OK)
  public async submitBatch(
    @Body() body: { items: Array<Record<string, unknown>> },
    @Query('actor') actor = 'client'
  ): Promise<WebRtcSfuMeshBatchProcessResult> {
    return this.service.processBatch(body.items, actor);
  }

  @Get('records/:id')
  @HttpCode(HttpStatus.OK)
  public getRecord(@Param('id') id: string): WebRtcSfuMeshRecord {
    return this.service.getRecordById(id);
  }

  @Get('records')
  @HttpCode(HttpStatus.OK)
  public queryRecords(
    @Query('status') status?: WebRtcSfuMeshState,
    @Query('severity') severity?: WebRtcSfuMeshSeverity,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: number,
    @Query('endDate') endDate?: number,
    @Query('sortBy') sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): { total: number; items: WebRtcSfuMeshRecord[] } {
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
  public getAuditTrail(@Query('limit') limit = 100): WebRtcSfuMeshAuditEvent[] {
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
