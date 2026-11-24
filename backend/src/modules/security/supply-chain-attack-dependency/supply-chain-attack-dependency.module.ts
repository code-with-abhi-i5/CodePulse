/**
 * @file supply-chain-attack-dependency.module.ts
 * @description NestJS module configuring [SEC-TYPOSQUAT-113]: Supply Chain Attack & Dependency Typosquatting Scanner with Shannon Entropy Analyzer.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SupplyChainAttackDependencyService } from './supply-chain-attack-dependency.service';
import { SupplyChainAttackDependencyController } from './supply-chain-attack-dependency.controller';

@Module({
  controllers: [SupplyChainAttackDependencyController],
  providers: [SupplyChainAttackDependencyService],
  exports: [SupplyChainAttackDependencyService],
})
export class SupplyChainAttackDependencyModule {}
