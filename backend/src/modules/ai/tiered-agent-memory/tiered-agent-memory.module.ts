/**
 * @file tiered-agent-memory.module.ts
 * @description NestJS module configuring [AI-MEMORY-076]: Tiered AI Agent Memory Store Combining Short-Term Ephemeral Buffer & Long-Term Vector Recall.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { TieredAgentMemoryService } from './tiered-agent-memory.service';
import { TieredAgentMemoryController } from './tiered-agent-memory.controller';

@Module({
  controllers: [TieredAgentMemoryController],
  providers: [TieredAgentMemoryService],
  exports: [TieredAgentMemoryService],
})
export class TieredAgentMemoryModule {}
