/**
 * @file implement-weekly-boss-challenge.module.ts
 * @description NestJS module configuring [FEAT]: Implement Weekly Boss Challenge Rotator with XP Streak Multipliers in Challenges Worker.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ImplementWeeklyBossChallengeService } from './implement-weekly-boss-challenge.service';
import { ImplementWeeklyBossChallengeController } from './implement-weekly-boss-challenge.controller';

@Module({
  controllers: [ImplementWeeklyBossChallengeController],
  providers: [ImplementWeeklyBossChallengeService],
  exports: [ImplementWeeklyBossChallengeService],
})
export class ImplementWeeklyBossChallengeModule {}
