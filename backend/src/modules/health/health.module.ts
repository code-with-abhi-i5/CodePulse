import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MultiCloudDrService } from './multi-cloud-dr.service';
import { GameDayRunnerService } from './gameday-runner.service';

@Module({
  controllers: [HealthController],
  providers: [MultiCloudDrService, GameDayRunnerService],
  exports: [MultiCloudDrService, GameDayRunnerService],
})
export class HealthModule {}
