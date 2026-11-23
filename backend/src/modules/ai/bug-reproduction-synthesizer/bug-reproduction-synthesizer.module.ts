/**
 * @file bug-reproduction-synthesizer.module.ts
 * @description NestJS module configuring [AI-REPRO-066]: Automated Bug Reproduction Script Synthesizer from Unstructured GitHub Issues.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { BugReproductionSynthesizerService } from './bug-reproduction-synthesizer.service';
import { BugReproductionSynthesizerController } from './bug-reproduction-synthesizer.controller';

@Module({
  controllers: [BugReproductionSynthesizerController],
  providers: [BugReproductionSynthesizerService],
  exports: [BugReproductionSynthesizerService],
})
export class BugReproductionSynthesizerModule {}
