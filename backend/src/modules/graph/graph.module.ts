import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DeveloperGraphService } from './developer-graph.service';
import { GraphController } from './graph.controller';
import { GraphSyncWorker } from './graph-sync.worker';
import { BetweennessCalculatorService } from './betweenness-calculator.service';
import { NetworkCentralityService } from './network-centrality.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'graph-sync',
    }),
  ],
  controllers: [GraphController],
  providers: [
    DeveloperGraphService,
    GraphSyncWorker,
    BetweennessCalculatorService,
    NetworkCentralityService,
  ],
  exports: [
    DeveloperGraphService,
    BetweennessCalculatorService,
    NetworkCentralityService,
  ],
})
export class GraphModule {}
