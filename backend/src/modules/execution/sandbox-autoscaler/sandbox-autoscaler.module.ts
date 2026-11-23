/**
 * @file sandbox-autoscaler.module.ts
 * @description NestJS module configuring [SANDBOX-AUTOSCALER-052]: Predictive Sandbox Pod Auto-Scaler Integrating Contest Schedule & Queue Growth Rate.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SandboxAutoscalerService } from './sandbox-autoscaler.service';
import { SandboxAutoscalerController } from './sandbox-autoscaler.controller';

@Module({
  controllers: [SandboxAutoscalerController],
  providers: [SandboxAutoscalerService],
  exports: [SandboxAutoscalerService],
})
export class SandboxAutoscalerModule {}
