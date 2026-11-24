/**
 * @file spatial-audio-engine.module.ts
 * @description NestJS module configuring [NET-SPATIAL-AUDIO-099]: 3D Spatial Audio Coordinate Panner & Distance Attenuation Engine for Virtual Hackathons.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SpatialAudioEngineService } from './spatial-audio-engine.service';
import { SpatialAudioEngineController } from './spatial-audio-engine.controller';

@Module({
  controllers: [SpatialAudioEngineController],
  providers: [SpatialAudioEngineService],
  exports: [SpatialAudioEngineService],
})
export class SpatialAudioEngineModule {}
