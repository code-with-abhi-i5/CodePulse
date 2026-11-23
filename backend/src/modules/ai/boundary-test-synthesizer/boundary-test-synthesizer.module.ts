/**
 * @file boundary-test-synthesizer.module.ts
 * @description NestJS module configuring [AI-TESTGEN-064]: Dynamic Boundary Condition Test Suite Synthesizer with Coverage-Guided Fuzzing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { BoundaryTestSynthesizerService } from './boundary-test-synthesizer.service';
import { BoundaryTestSynthesizerController } from './boundary-test-synthesizer.controller';

@Module({
  controllers: [BoundaryTestSynthesizerController],
  providers: [BoundaryTestSynthesizerService],
  exports: [BoundaryTestSynthesizerService],
})
export class BoundaryTestSynthesizerModule {}
