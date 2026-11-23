import { Module } from '@nestjs/common';
import { ResourceReaperService } from './resource-reaper.service';
import { CloudCostController } from './cloud-cost.controller';
import { FinOpsReaperService } from './finops-reaper.service';
import { CloudController } from './cloud.controller';
import { QueueVelocityProbeService } from './queue-velocity-probe.service';
import { CompositeAutoscalerService } from './composite-autoscaler.service';

@Module({
  controllers: [CloudCostController, CloudController],
  providers: [
    ResourceReaperService,
    FinOpsReaperService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
  ],
  exports: [
    ResourceReaperService,
    FinOpsReaperService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
  ],
})
export class CloudModule {}
