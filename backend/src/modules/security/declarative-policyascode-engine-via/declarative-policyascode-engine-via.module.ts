/**
 * @file declarative-policyascode-engine-via.module.ts
 * @description NestJS module configuring [SEC-OPA-104]: Declarative Policy-as-Code Engine via Open Policy Agent (OPA) / Rego for Enterprise RBAC.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DeclarativePolicyascodeEngineViaService } from './declarative-policyascode-engine-via.service';
import { DeclarativePolicyascodeEngineViaController } from './declarative-policyascode-engine-via.controller';

@Module({
  controllers: [DeclarativePolicyascodeEngineViaController],
  providers: [DeclarativePolicyascodeEngineViaService],
  exports: [DeclarativePolicyascodeEngineViaService],
})
export class DeclarativePolicyascodeEngineViaModule {}
