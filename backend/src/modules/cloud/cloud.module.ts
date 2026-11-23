import { Module } from '@nestjs/common';
import { ResourceReaperService } from './resource-reaper.service';
import { CloudCostController } from './cloud-cost.controller';
import { FinOpsReaperService } from './finops-reaper.service';
import { CloudController } from './cloud.controller';
import { K8sOperatorService } from './k8s-operator.service';
import { QueueVelocityProbeService } from './queue-velocity-probe.service';
import { CompositeAutoscalerService } from './composite-autoscaler.service';

@Module({
  controllers: [CloudCostController, CloudController],
  providers: [
    ResourceReaperService,
    FinOpsReaperService,
    K8sOperatorService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
  ],
  exports: [
    ResourceReaperService,
    FinOpsReaperService,
    K8sOperatorService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
  ],
})
export class CloudModule {}
