/**
 * @file zerodowntime-dualkey-signing-automated.module.ts
 * @description NestJS module configuring [SEC-KEY-ROTATION-110]: Zero-Downtime Dual-Key Signing & Automated JWT Key Rotation Pipeline.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ZerodowntimeDualkeySigningAutomatedService } from './zerodowntime-dualkey-signing-automated.service';
import { ZerodowntimeDualkeySigningAutomatedController } from './zerodowntime-dualkey-signing-automated.controller';

@Module({
  controllers: [ZerodowntimeDualkeySigningAutomatedController],
  providers: [ZerodowntimeDualkeySigningAutomatedService],
  exports: [ZerodowntimeDualkeySigningAutomatedService],
})
export class ZerodowntimeDualkeySigningAutomatedModule {}
