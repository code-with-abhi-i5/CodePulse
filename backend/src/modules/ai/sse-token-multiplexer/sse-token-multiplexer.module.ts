/**
 * @file sse-token-multiplexer.module.ts
 * @description NestJS module configuring [AI-STREAM-062]: Server-Sent Events (SSE) LLM Token Multiplexer with Predictive Backpressure & Cancellation.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SseTokenMultiplexerService } from './sse-token-multiplexer.service';
import { SseTokenMultiplexerController } from './sse-token-multiplexer.controller';

@Module({
  controllers: [SseTokenMultiplexerController],
  providers: [SseTokenMultiplexerService],
  exports: [SseTokenMultiplexerService],
})
export class SseTokenMultiplexerModule {}
