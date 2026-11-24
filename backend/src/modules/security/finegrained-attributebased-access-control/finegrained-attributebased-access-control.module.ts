/**
 * @file finegrained-attributebased-access-control.module.ts
 * @description NestJS module configuring [SEC-ABAC-120]: Fine-Grained Attribute-Based Access Control (ABAC) Matrix with Dynamic Contextual Filtering.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { FinegrainedAttributebasedAccessControlService } from './finegrained-attributebased-access-control.service';
import { FinegrainedAttributebasedAccessControlController } from './finegrained-attributebased-access-control.controller';

@Module({
  controllers: [FinegrainedAttributebasedAccessControlController],
  providers: [FinegrainedAttributebasedAccessControlService],
  exports: [FinegrainedAttributebasedAccessControlService],
})
export class FinegrainedAttributebasedAccessControlModule {}
