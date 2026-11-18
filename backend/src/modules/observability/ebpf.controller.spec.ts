import { Test, TestingModule } from '@nestjs/testing';
import { EbpfController } from './ebpf.controller';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { MetricsBasicAuthGuard } from '../metrics/metrics-basic-auth.guard';

/* eslint-disable @typescript-eslint/unbound-method */

describe('EbpfController', () => {
  let controller: EbpfController;
  let ebpfService: jest.Mocked<EbpfMonitorService>;

  beforeEach(async () => {
    ebpfService = {
      getObservabilitySummary: jest.fn().mockReturnValue({
        bpfLoaded: true,
        activeRingBufferStreams: 1,
        totalEventsProcessed: 120,
        detectedNetworkStallsCount: 2,
        metricsSummary: {
          postgres: {
            avgLatencyUs: 340,
            retransmitCount: 1,
            queueDropsCount: 0,
          },
          redis: { avgLatencyUs: 120, retransmitCount: 0, queueDropsCount: 0 },
          nestjs: { avgLatencyUs: 85, retransmitCount: 0, queueDropsCount: 0 },
        },
        recentStalls: [],
      }),
      getPrometheusMetrics: jest
        .fn()
        .mockResolvedValue(
          '# HELP ebpf_tcp_handshake_latency_microseconds Kernel latency\n',
        ),
    } as unknown as jest.Mocked<EbpfMonitorService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EbpfController],
      providers: [{ provide: EbpfMonitorService, useValue: ebpfService }],
    })
      .overrideGuard(MetricsBasicAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EbpfController>(EbpfController);
  });

  it('should return eBPF observability summary on GET /observability/ebpf/summary', () => {
    const summary = controller.getSummary();
    expect(ebpfService.getObservabilitySummary).toHaveBeenCalled();
    expect(summary.bpfLoaded).toBe(true);
    expect(summary.totalEventsProcessed).toBe(120);
    expect(summary.metricsSummary.postgres.avgLatencyUs).toBe(340);
  });

  it('should export Prometheus metrics on GET /observability/ebpf/metrics', async () => {
    const metrics = await controller.getMetrics();
    expect(ebpfService.getPrometheusMetrics).toHaveBeenCalled();
    expect(metrics).toContain('ebpf_tcp_handshake_latency_microseconds');
  });
});
