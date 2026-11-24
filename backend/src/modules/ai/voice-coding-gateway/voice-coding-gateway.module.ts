/**
 * @file voice-coding-gateway.module.ts
 * @description NestJS module configuring [AI-VOICE-080]: Real-Time Full-Duplex Voice Coding Assistant Gateway with WebRTC & Audio Turn-Detection.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { VoiceCodingGatewayService } from './voice-coding-gateway.service';
import { VoiceCodingGatewayController } from './voice-coding-gateway.controller';

@Module({
  controllers: [VoiceCodingGatewayController],
  providers: [VoiceCodingGatewayService],
  exports: [VoiceCodingGatewayService],
})
export class VoiceCodingGatewayModule {}
