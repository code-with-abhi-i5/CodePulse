import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GeoDnsService } from './geo-dns.service';
import { MultiCloudDrService } from './multi-cloud-dr.service';
import { GameDayRunnerService } from './gameday-runner.service';

@Module({
  controllers: [HealthController],
  providers: [GeoDnsService, MultiCloudDrService, GameDayRunnerService],
  exports: [GeoDnsService, MultiCloudDrService, GameDayRunnerService],
})
export class HealthModule {}
