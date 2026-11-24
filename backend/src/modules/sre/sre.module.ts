import { Module } from '@nestjs/common';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { LatencyInjectorService } from './latency-injector.service';
import { ChaosInjectionService } from './chaos-injection.service';

@Module({
  providers: [
    EbpfMonitorService,
    LatencyInjectorService,
    ChaosInjectionService,
  ],
  exports: [
    EbpfMonitorService,
    LatencyInjectorService,
    ChaosInjectionService,
  ],
})
export class SreModule {}
