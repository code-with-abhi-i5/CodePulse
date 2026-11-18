import { Module } from '@nestjs/common';
import { DeveloperGraphService } from './developer-graph.service';

@Module({
  providers: [DeveloperGraphService],
  exports: [DeveloperGraphService],
})
export class GraphModule {}
