import { Module } from '@nestjs/common';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { EbpfMetricsService } from './ebpf-metrics.service';
import { EbpfTracerService } from './ebpf-tracer.service';
import { EbpfController } from './ebpf.controller';
import { GoldenSignalsForecasterService } from './golden-signals-forecaster.service';
import { OtelInitializerService } from './otel-initializer.service';
import { DistributedTracingService } from './distributed-tracing.service';
import { EbpfProfilerService } from './ebpf-profiler.service';
import { FlamegraphGeneratorService } from './flamegraph-generator.service';
import { PerfHooksMonitorService } from './perf-hooks-monitor.service';
import { GcWatchdogService } from './gc-watchdog.service';
import { CommitErrorMatcherService } from './commit-error-matcher.service';
import { RcaCorrelatorService } from './rca-correlator.service';

@Module({
  controllers: [EbpfController],
  providers: [
    EbpfMonitorService,
    EbpfMetricsService,
    EbpfTracerService,
    GoldenSignalsForecasterService,
    OtelInitializerService,
    DistributedTracingService,
    EbpfProfilerService,
    FlamegraphGeneratorService,
    PerfHooksMonitorService,
    GcWatchdogService,
    CommitErrorMatcherService,
    RcaCorrelatorService,
  ],
  exports: [
    EbpfMonitorService,
    EbpfMetricsService,
    EbpfTracerService,
    GoldenSignalsForecasterService,
    OtelInitializerService,
    DistributedTracingService,
    EbpfProfilerService,
    FlamegraphGeneratorService,
    PerfHooksMonitorService,
    GcWatchdogService,
    CommitErrorMatcherService,
    RcaCorrelatorService,
  ],
})
export class ObservabilityModule {}
