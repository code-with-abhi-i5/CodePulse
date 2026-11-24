/**
 * @file code-self-repair-engine.module.ts
 * @description NestJS module configuring [AI-REPAIR-075]: Automated Syntactic & Semantic Code Self-Repair Engine with Compiler Feedback Loops.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CodeSelfRepairEngineService } from './code-self-repair-engine.service';
import { CodeSelfRepairEngineController } from './code-self-repair-engine.controller';

@Module({
  controllers: [CodeSelfRepairEngineController],
  providers: [CodeSelfRepairEngineService],
  exports: [CodeSelfRepairEngineService],
})
export class CodeSelfRepairEngineModule {}
