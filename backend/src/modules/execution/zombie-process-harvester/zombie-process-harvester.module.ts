/**
 * @file zombie-process-harvester.module.ts
 * @description NestJS module configuring [SANDBOX-CLEANUP-059]: Zombie Process Harvester & Subreaper Daemon with Zero Orphaned File Descriptor Leakage.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ZombieProcessHarvesterService } from './zombie-process-harvester.service';
import { ZombieProcessHarvesterController } from './zombie-process-harvester.controller';

@Module({
  controllers: [ZombieProcessHarvesterController],
  providers: [ZombieProcessHarvesterService],
  exports: [ZombieProcessHarvesterService],
})
export class ZombieProcessHarvesterModule {}
