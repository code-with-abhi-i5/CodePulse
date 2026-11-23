/**
 * @file adaptive-hint-engine.module.ts
 * @description NestJS module configuring [AI-HINTS-067]: Adaptive Progressive Hint Generation Engine with Levenshtein-Distance Keystroke Tracking.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AdaptiveHintEngineService } from './adaptive-hint-engine.service';
import { AdaptiveHintEngineController } from './adaptive-hint-engine.controller';

@Module({
  controllers: [AdaptiveHintEngineController],
  providers: [AdaptiveHintEngineService],
  exports: [AdaptiveHintEngineService],
})
export class AdaptiveHintEngineModule {}
