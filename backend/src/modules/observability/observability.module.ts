import { Module } from '@nestjs/common';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { EbpfMetricsService } from './ebpf-metrics.service';
import { EbpfTracerService } from './ebpf-tracer.service';
import { EbpfController } from './ebpf.controller';
import { GoldenSignalsForecasterService } from './golden-signals-forecaster.service';
import { TraceInjectorService } from './trace-injector.service';
import { EventTracingPropagatorService } from './event-tracing-propagator.service';
import { HeapProfilerService } from './heap-profiler.service';
import { MemoryLeakDetectorService } from './memory-leak-detector.service';

@Module({
  controllers: [EbpfController],
  providers: [
    EbpfMonitorService,
    EbpfMetricsService,
    EbpfTracerService,
    GoldenSignalsForecasterService,
    TraceInjectorService,
    EventTracingPropagatorService,
    HeapProfilerService,
    MemoryLeakDetectorService,
  ],
  exports: [
    EbpfMonitorService,
    EbpfMetricsService,
    EbpfTracerService,
    GoldenSignalsForecasterService,
    TraceInjectorService,
    EventTracingPropagatorService,
    HeapProfilerService,
    MemoryLeakDetectorService,
  ],
})
export class ObservabilityModule {}
