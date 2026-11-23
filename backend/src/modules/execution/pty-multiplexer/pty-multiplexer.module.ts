/**
 * @file pty-multiplexer.module.ts
 * @description NestJS module configuring [SANDBOX-PTY-050]: High-Performance Pseudo-Terminal (PTY) Multiplexer with ANSI/VT100 Escape Parser.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PtyMultiplexerService } from './pty-multiplexer.service';
import { PtyMultiplexerController } from './pty-multiplexer.controller';

@Module({
  controllers: [PtyMultiplexerController],
  providers: [PtyMultiplexerService],
  exports: [PtyMultiplexerService],
})
export class PtyMultiplexerModule {}
