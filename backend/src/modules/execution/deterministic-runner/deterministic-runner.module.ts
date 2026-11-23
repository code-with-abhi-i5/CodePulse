/**
 * @file deterministic-runner.module.ts
 * @description NestJS module configuring [SANDBOX-DETERMINISTIC-055]: Deterministic Execution Runner with Virtual Clock & Entropy Seeding for Reproducible Tests.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DeterministicRunnerService } from './deterministic-runner.service';
import { DeterministicRunnerController } from './deterministic-runner.controller';

@Module({
  controllers: [DeterministicRunnerController],
  providers: [DeterministicRunnerService],
  exports: [DeterministicRunnerService],
})
export class DeterministicRunnerModule {}
