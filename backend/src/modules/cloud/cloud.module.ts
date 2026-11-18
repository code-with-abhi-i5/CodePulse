import { Module } from '@nestjs/common';
import { ResourceReaperService } from './resource-reaper.service';
import { CloudCostController } from './cloud-cost.controller';

@Module({
  controllers: [CloudCostController],
  providers: [ResourceReaperService],
  exports: [ResourceReaperService],
})
export class CloudModule {}
