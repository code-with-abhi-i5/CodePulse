import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GeoDnsService } from './geo-dns.service';
import type {
  GeoDnsStatusReport,
  RouteOptimizationDecision,
} from './geo-dns.service';

export class DivertTrafficDto {
  fromRegion!: string;
  toRegion!: string;
  reason?: string;
}

export class SimulateProbeDto {
  hubId!: string;
  latencyMs!: number;
  consecutiveFailures?: number;
}

@Controller('health')
export class HealthController {
  constructor(private readonly geoDnsService: GeoDnsService) {}

  @Get()
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('geo-dns')
  getGeoDnsStatus(): GeoDnsStatusReport {
    return this.geoDnsService.getGeoDnsStatus();
  }

  @Post('geo-dns/divert')
  @HttpCode(HttpStatus.OK)
  async divertTraffic(
    @Body() dto: DivertTrafficDto,
  ): Promise<RouteOptimizationDecision> {
    if (!dto.fromRegion || !dto.toRegion) {
      throw new BadRequestException('fromRegion and toRegion are required');
    }
    return this.geoDnsService.divertTraffic(
      dto.fromRegion,
      dto.toRegion,
      dto.reason || 'Manual disaster recovery drill or operator override',
    );
  }

  @Post('geo-dns/simulate-probe')
  @HttpCode(HttpStatus.OK)
  simulateProbe(@Body() dto: SimulateProbeDto): {
    success: boolean;
    hubId: string;
  } {
    if (!dto.hubId || typeof dto.latencyMs !== 'number') {
      throw new BadRequestException('hubId and numeric latencyMs are required');
    }
    this.geoDnsService.simulateProbeLatency(
      dto.hubId,
      dto.latencyMs,
      dto.consecutiveFailures ?? 0,
    );
    return { success: true, hubId: dto.hubId };
  }
}
