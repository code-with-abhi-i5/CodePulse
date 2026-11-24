import { Module } from '@nestjs/common';
import { ResourceReaperService } from './resource-reaper.service';
import { CloudCostController } from './cloud-cost.controller';
import { FinOpsReaperService } from './finops-reaper.service';
import { CloudController } from './cloud.controller';
import { K8sOperatorService } from './k8s-operator.service';
import { QueueVelocityProbeService } from './queue-velocity-probe.service';
import { CompositeAutoscalerService } from './composite-autoscaler.service';
import { K8sNamespaceCleanerService } from './k8s-namespace-cleaner.service';
import { PreviewEnvManagerService } from './preview-env-manager.service';

@Module({
  controllers: [CloudCostController, CloudController],
  providers: [
    ResourceReaperService,
    FinOpsReaperService,
    K8sOperatorService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
    K8sNamespaceCleanerService,
    PreviewEnvManagerService,
  ],
  exports: [
    ResourceReaperService,
    FinOpsReaperService,
    K8sOperatorService,
    QueueVelocityProbeService,
    CompositeAutoscalerService,
    K8sNamespaceCleanerService,
    PreviewEnvManagerService,
  ],
})
export class CloudModule {}
