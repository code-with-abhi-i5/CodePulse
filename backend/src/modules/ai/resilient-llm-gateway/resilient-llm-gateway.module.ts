/**
 * @file resilient-llm-gateway.module.ts
 * @description NestJS module configuring [AI-GATEWAY-071]: Multi-Model Resilient LLM Gateway with Latency-Based Dynamic Routing & Auto-Failover.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ResilientLlmGatewayService } from './resilient-llm-gateway.service';
import { ResilientLlmGatewayController } from './resilient-llm-gateway.controller';

@Module({
  controllers: [ResilientLlmGatewayController],
  providers: [ResilientLlmGatewayService],
  exports: [ResilientLlmGatewayService],
})
export class ResilientLlmGatewayModule {}
