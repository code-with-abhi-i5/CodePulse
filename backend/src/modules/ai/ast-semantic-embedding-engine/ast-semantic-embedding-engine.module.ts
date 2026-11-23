/**
 * @file ast-semantic-embedding-engine.module.ts
 * @description NestJS module configuring [AI-RAG-061]: Hierarchical AST Multi-Vector Semantic Code Embedding & Hybrid Dense-Sparse Search Engine.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AstSemanticEmbeddingEngineService } from './ast-semantic-embedding-engine.service';
import { AstSemanticEmbeddingEngineController } from './ast-semantic-embedding-engine.controller';

@Module({
  controllers: [AstSemanticEmbeddingEngineController],
  providers: [AstSemanticEmbeddingEngineService],
  exports: [AstSemanticEmbeddingEngineService],
})
export class AstSemanticEmbeddingEngineModule {}
