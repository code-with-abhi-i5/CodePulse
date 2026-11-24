/**
 * @file rollback-netcode-engine.module.ts
 * @description NestJS module configuring [NET-ROLLBACK-082]: GGPO-Style Rollback Netcode Engine with Client-Side Frame Prediction Under 150ms+ Lag.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { RollbackNetcodeEngineService } from './rollback-netcode-engine.service';
import { RollbackNetcodeEngineController } from './rollback-netcode-engine.controller';

@Module({
  controllers: [RollbackNetcodeEngineController],
  providers: [RollbackNetcodeEngineService],
  exports: [RollbackNetcodeEngineService],
})
export class RollbackNetcodeEngineModule {}
