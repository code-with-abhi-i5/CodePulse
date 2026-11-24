/**
 * @file caster-studio-multiplexer.module.ts
 * @description NestJS module configuring [NET-CASTER-STUDIO-097]: Live Esports Multi-Perspective Caster Studio with Hotkey Video & Code Feed Switching.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CasterStudioMultiplexerService } from './caster-studio-multiplexer.service';
import { CasterStudioMultiplexerController } from './caster-studio-multiplexer.controller';

@Module({
  controllers: [CasterStudioMultiplexerController],
  providers: [CasterStudioMultiplexerService],
  exports: [CasterStudioMultiplexerService],
})
export class CasterStudioMultiplexerModule {}
