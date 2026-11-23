/**
 * @file oom-watchdog.module.ts
 * @description NestJS module configuring [SANDBOX-OOM-047]: Real-Time Execution Memory Leak & Heap Explosion Early-Warning Watchdog.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { OomWatchdogService } from './oom-watchdog.service';
import { OomWatchdogController } from './oom-watchdog.controller';

@Module({
  controllers: [OomWatchdogController],
  providers: [OomWatchdogService],
  exports: [OomWatchdogService],
})
export class OomWatchdogModule {}
