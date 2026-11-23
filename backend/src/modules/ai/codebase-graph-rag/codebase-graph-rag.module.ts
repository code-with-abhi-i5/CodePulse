/**
 * @file codebase-graph-rag.module.ts
 * @description NestJS module configuring [AI-GRAPH-RAG-068]: Neo4j Codebase Knowledge Graph RAG with Deep Call-Graph Dependency Traversal.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CodebaseGraphRagService } from './codebase-graph-rag.service';
import { CodebaseGraphRagController } from './codebase-graph-rag.controller';

@Module({
  controllers: [CodebaseGraphRagController],
  providers: [CodebaseGraphRagService],
  exports: [CodebaseGraphRagService],
})
export class CodebaseGraphRagModule {}
