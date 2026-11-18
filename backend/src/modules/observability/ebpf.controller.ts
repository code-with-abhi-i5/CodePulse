import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { EbpfMonitorService } from './ebpf-monitor.service';
import type { EbpfObservabilitySummary } from './ebpf-monitor.service';
import { MetricsBasicAuthGuard } from '../metrics/metrics-basic-auth.guard';

@ApiTags('observability')
@Controller('observability/ebpf')
export class EbpfController {
  constructor(private readonly ebpfService: EbpfMonitorService) {}

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get eBPF kernel network observability summary, stall detections, and socket metrics',
  })
  getSummary(): EbpfObservabilitySummary {
    return this.ebpfService.getObservabilitySummary();
  }

  @Get('metrics')
  @UseGuards(MetricsBasicAuthGuard)
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary:
      'Export eBPF kernel network latency metrics for Prometheus/Grafana',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics for eBPF socket tracing',
  })
  async getMetrics(): Promise<string> {
    return this.ebpfService.getPrometheusMetrics();
  }
}
