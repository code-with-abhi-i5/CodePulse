/**
 * @file hierarchical-token-budgeter.module.ts
 * @description NestJS module configuring [AI-TOKEN-BUDGET-072]: Hierarchical Token Budgeter & Quota Governor with Sliding-Window Organization Caps.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { HierarchicalTokenBudgeterService } from './hierarchical-token-budgeter.service';
import { HierarchicalTokenBudgeterController } from './hierarchical-token-budgeter.controller';

@Module({
  controllers: [HierarchicalTokenBudgeterController],
  providers: [HierarchicalTokenBudgeterService],
  exports: [HierarchicalTokenBudgeterService],
})
export class HierarchicalTokenBudgeterModule {}
