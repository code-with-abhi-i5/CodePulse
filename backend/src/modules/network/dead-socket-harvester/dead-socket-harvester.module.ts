/**
 * @file dead-socket-harvester.module.ts
 * @description NestJS module configuring [NET-ZOMBIE-095]: Sliding-Window Heartbeat Watchdog & Dead Socket Harvester for WebSocket Fleets.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DeadSocketHarvesterService } from './dead-socket-harvester.service';
import { DeadSocketHarvesterController } from './dead-socket-harvester.controller';

@Module({
  controllers: [DeadSocketHarvesterController],
  providers: [DeadSocketHarvesterService],
  exports: [DeadSocketHarvesterService],
})
export class DeadSocketHarvesterModule {}
