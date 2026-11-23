/**
 * @file semantic-vector-cache.module.ts
 * @description NestJS module configuring [AI-CACHE-070]: Semantic Vector Similarity Cache for LLM Code Explanations & Ast Questions.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SemanticVectorCacheService } from './semantic-vector-cache.service';
import { SemanticVectorCacheController } from './semantic-vector-cache.controller';

@Module({
  controllers: [SemanticVectorCacheController],
  providers: [SemanticVectorCacheService],
  exports: [SemanticVectorCacheService],
})
export class SemanticVectorCacheModule {}
