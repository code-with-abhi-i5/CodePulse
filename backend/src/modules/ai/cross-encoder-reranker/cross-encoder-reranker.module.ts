/**
 * @file cross-encoder-reranker.module.ts
 * @description NestJS module configuring [AI-RERANKER-077]: Cross-Encoder Codebase Embedding Reranker for High-Precision Symbol Resolution.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CrossEncoderRerankerService } from './cross-encoder-reranker.service';
import { CrossEncoderRerankerController } from './cross-encoder-reranker.controller';

@Module({
  controllers: [CrossEncoderRerankerController],
  providers: [CrossEncoderRerankerService],
  exports: [CrossEncoderRerankerService],
})
export class CrossEncoderRerankerModule {}
