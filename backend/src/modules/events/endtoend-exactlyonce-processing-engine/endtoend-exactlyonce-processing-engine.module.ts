/**
 * @file endtoend-exactlyonce-processing-engine.module.ts
 * @description NestJS module configuring [EVENT-EXACTLY-ONCE-126]: End-to-End Exactly-Once Processing Engine with Distributed State Machine Deduplication.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { EndtoendExactlyonceProcessingEngineService } from './endtoend-exactlyonce-processing-engine.service';
import { EndtoendExactlyonceProcessingEngineController } from './endtoend-exactlyonce-processing-engine.controller';

@Module({
  controllers: [EndtoendExactlyonceProcessingEngineController],
  providers: [EndtoendExactlyonceProcessingEngineService],
  exports: [EndtoendExactlyonceProcessingEngineService],
})
export class EndtoendExactlyonceProcessingEngineModule {}
