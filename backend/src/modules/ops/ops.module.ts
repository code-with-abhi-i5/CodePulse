import { Module } from '@nestjs/common';
import { ChaosRunnerService } from './chaos-runner.service';
import { EtcdConfigService } from './etcd-config.service';
import { ActiveActiveReplicatorService } from './active-active-replicator.service';
import { SyncJournalService } from './sync-journal.service';
import { ActiveActiveReplicatorController } from './active-active-replicator.controller';
import { SpotBidderService } from './spot-bidder.service';
import { FailoverGatewayService } from './failover-gateway.service';
import { DataArchiverService } from './data-archiver.service';
import { ShardRebalancerService } from './shard-rebalancer.service';
import { IndexAdvisorService } from './index-advisor.service';
import { CostAttributionService } from './cost-attribution.service';
import { SavingsLedgerService } from './savings-ledger.service';
import { FinOpsReaperService } from './finops-reaper.service';

@Module({
  controllers: [ActiveActiveReplicatorController],
  providers: [
    ChaosRunnerService,
    EtcdConfigService,
    ActiveActiveReplicatorService,
    SyncJournalService,
    SpotBidderService,
    FailoverGatewayService,
    DataArchiverService,
    ShardRebalancerService,
    IndexAdvisorService,
    CostAttributionService,
    SavingsLedgerService,
    FinOpsReaperService,
  ],
  exports: [
    ChaosRunnerService,
    EtcdConfigService,
    ActiveActiveReplicatorService,
    SyncJournalService,
    SpotBidderService,
    FailoverGatewayService,
    DataArchiverService,
    ShardRebalancerService,
    IndexAdvisorService,
    CostAttributionService,
    SavingsLedgerService,
    FinOpsReaperService,
  ],
})
export class OpsModule {}
