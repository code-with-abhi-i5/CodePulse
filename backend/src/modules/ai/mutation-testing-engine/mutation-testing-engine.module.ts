/**
 * @file mutation-testing-engine.module.ts
 * @description NestJS module configuring [AI-MUTATION-073]: Automated Mutation Testing Engine Measuring Test Quality of AI-Synthesized Tests.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { MutationTestingEngineService } from './mutation-testing-engine.service';
import { MutationTestingEngineController } from './mutation-testing-engine.controller';

@Module({
  controllers: [MutationTestingEngineController],
  providers: [MutationTestingEngineService],
  exports: [MutationTestingEngineService],
})
export class MutationTestingEngineModule {}
