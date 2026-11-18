import { Module } from '@nestjs/common';
import { EbpfMonitorService } from './ebpf-monitor.service';
import { EbpfController } from './ebpf.controller';

@Module({
  controllers: [EbpfController],
  providers: [EbpfMonitorService],
  exports: [EbpfMonitorService],
})
export class ObservabilityModule {}
