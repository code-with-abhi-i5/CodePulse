import { Module } from '@nestjs/common';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { LatencyInjectorService } from './latency-injector.service';
import { ChaosInjectionService } from './chaos-injection.service';
import { DataRetentionReaperService } from './data-retention-reaper.service';

@Module({
  providers: [
    EbpfMonitorService,
    LatencyInjectorService,
    ChaosInjectionService,
    DataRetentionReaperService,
  ],
  exports: [
    EbpfMonitorService,
    LatencyInjectorService,
    ChaosInjectionService,
    DataRetentionReaperService,
  ],
})
export class SreModule {}
