/**
 * @file webrtc-sfu-mesh.module.ts
 * @description NestJS module configuring [NET-SFU-087]: Selective Forwarding Unit (SFU) WebRTC Mesh for Multi-Player Voice Chat & Screen-Sharing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebRtcSfuMeshService } from './webrtc-sfu-mesh.service';
import { WebRtcSfuMeshController } from './webrtc-sfu-mesh.controller';

@Module({
  controllers: [WebRtcSfuMeshController],
  providers: [WebRtcSfuMeshService],
  exports: [WebRtcSfuMeshService],
})
export class WebRtcSfuMeshModule {}
