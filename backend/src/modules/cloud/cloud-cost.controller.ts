import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ResourceReaperService,
  FinOpsDashboardMetrics,
  ReaperScanSummary,
} from './resource-reaper.service';

@ApiTags('admin')
@Controller('admin/cloud-costs')
export class CloudCostController {
  constructor(private readonly reaperService: ResourceReaperService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get FinOps multi-cloud cost optimization dashboard metrics and savings',
  })
  async getCloudCostMetrics(): Promise<FinOpsDashboardMetrics> {
    return this.reaperService.getFinOpsDashboardMetrics();
  }

  @Post('reap')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Manually trigger multi-cloud idle resource discovery and reaper scan',
  })
  async triggerReaperScan(): Promise<ReaperScanSummary> {
    return this.reaperService.runReaperScan();
  }

  @Post('off-peak')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enable or disable automated off-peak scaling to 0 replicas',
  })
  setOffPeakConfig(@Body('enabled') enabled: boolean): {
    enabled: boolean;
    message: string;
  } {
    this.reaperService.setOffPeakEnabled(enabled);
    return {
      enabled,
      message: `Off-peak non-production node pool scaling set to ${enabled}`,
    };
  }
}
