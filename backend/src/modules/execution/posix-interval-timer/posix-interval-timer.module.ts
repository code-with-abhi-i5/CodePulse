/**
 * @file posix-interval-timer.module.ts
 * @description NestJS module configuring [SANDBOX-POSIX-TIMER-053]: Microsecond Precision POSIX Interval Timer & SIGXCPU Timeout Guard for Untrusted Runtimes.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PosixIntervalTimerService } from './posix-interval-timer.service';
import { PosixIntervalTimerController } from './posix-interval-timer.controller';

@Module({
  controllers: [PosixIntervalTimerController],
  providers: [PosixIntervalTimerService],
  exports: [PosixIntervalTimerService],
})
export class PosixIntervalTimerModule {}
