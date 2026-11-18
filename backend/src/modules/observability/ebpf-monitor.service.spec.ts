import { Test, TestingModule } from '@nestjs/testing';
import {
  EbpfMonitorService,
  EbpfTcpEvent,
  IEbpfRingBufferReader,
} from './ebpf-monitor.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('EbpfMonitorService', () => {
  let service: EbpfMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EbpfMonitorService],
    }).compile();

    service = module.get<EbpfMonitorService>(EbpfMonitorService);
  });

  afterEach(() => {
    service.stopTracing();
  });

  it('should initialize with 0 processed events and classify ports correctly', () => {
    expect(service.classifyService(5432)).toBe('POSTGRES');
    expect(service.classifyService(6379)).toBe('REDIS');
    expect(service.classifyService(3001)).toBe('NESTJS');
    expect(service.classifyService(8080)).toBe('UNKNOWN');

    const summary = service.getObservabilitySummary();
    expect(summary.totalEventsProcessed).toBe(0);
    expect(summary.detectedNetworkStallsCount).toBe(0);
  });

  it('should process TCP handshake latency and record Prometheus metrics', async () => {
    const postgresEvent: EbpfTcpEvent = {
      sourceAddress: '10.0.0.1',
      destinationAddress: '10.0.0.2',
      sourcePort: 43210,
      destinationPort: 5432,
      service: 'POSTGRES',
      latencyUs: 450, // 450 microseconds
      retransmits: 0,
      drops: 0,
      pid: 1234,
      comm: 'node',
      timestamp: '2026-11-17T12:00:00Z',
    };

    service.processEbpfEvent(postgresEvent);

    const summary = service.getObservabilitySummary();
    expect(summary.totalEventsProcessed).toBe(1);
    expect(summary.metricsSummary.postgres.avgLatencyUs).toBe(450);
    expect(summary.detectedNetworkStallsCount).toBe(0);

    const metricsText = await service.getPrometheusMetrics();
    expect(metricsText).toContain('ebpf_tcp_handshake_latency_microseconds');
    expect(metricsText).toContain('POSTGRES');
  });

  it('should detect microsecond network stalls (>= 5000 us) invisible to userspace profilers', () => {
    const redisStallEvent: EbpfTcpEvent = {
      sourceAddress: '10.0.0.1',
      destinationAddress: '10.0.0.3',
      sourcePort: 55432,
      destinationPort: 6379,
      service: 'REDIS',
      latencyUs: 8500, // 8.5ms stall
      retransmits: 0,
      drops: 0,
      pid: 1234,
      comm: 'node',
      timestamp: '2026-11-17T12:01:00Z',
    };

    service.processEbpfEvent(redisStallEvent);

    const summary = service.getObservabilitySummary();
    expect(summary.detectedNetworkStallsCount).toBe(1);
    expect(summary.recentStalls.length).toBe(1);
    expect(summary.recentStalls[0].service).toBe('REDIS');
    expect(summary.recentStalls[0].latencyUs).toBe(8500);
    expect(summary.recentStalls[0].reason).toContain('8.50 ms');
  });

  it('should record TCP retransmissions and socket queue buffer drops', async () => {
    const retransmitEvent: EbpfTcpEvent = {
      sourceAddress: '10.0.0.1',
      destinationAddress: '10.0.0.2',
      sourcePort: 43210,
      destinationPort: 5432,
      service: 'POSTGRES',
      latencyUs: 0,
      retransmits: 3,
      drops: 2,
      pid: 1234,
      comm: 'node',
      timestamp: '2026-11-17T12:02:00Z',
    };

    service.processEbpfEvent(retransmitEvent);

    const summary = service.getObservabilitySummary();
    expect(summary.metricsSummary.postgres.retransmitCount).toBe(3);
    expect(summary.metricsSummary.postgres.queueDropsCount).toBe(2);

    const metricsText = await service.getPrometheusMetrics();
    expect(metricsText).toContain('ebpf_tcp_retransmissions_total');
    expect(metricsText).toContain('ebpf_socket_queue_drops_total');
  });

  it('should consume events from custom ring buffer reader', () => {
    let capturedCallback: ((event: EbpfTcpEvent) => void) | null = null;
    const mockReader: IEbpfRingBufferReader = {
      startListening: jest
        .fn()
        .mockImplementation((cb: (event: EbpfTcpEvent) => void) => {
          capturedCallback = cb;
        }),
      stopListening: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    service.setRingBufferReader(mockReader);
    service.startTracing();

    expect(mockReader.startListening).toHaveBeenCalled();
    expect(service.getObservabilitySummary().bpfLoaded).toBe(true);

    // Simulate ring buffer event delivery
    if (capturedCallback) {
      (capturedCallback as (event: EbpfTcpEvent) => void)({
        sourceAddress: '127.0.0.1',
        destinationAddress: '127.0.0.1',
        sourcePort: 3001,
        destinationPort: 3001,
        service: 'NESTJS',
        latencyUs: 120,
        retransmits: 0,
        drops: 0,
        pid: 999,
        comm: 'nest',
        timestamp: '2026-11-17T12:03:00Z',
      });
    }

    expect(service.getObservabilitySummary().totalEventsProcessed).toBe(1);
  });
});
