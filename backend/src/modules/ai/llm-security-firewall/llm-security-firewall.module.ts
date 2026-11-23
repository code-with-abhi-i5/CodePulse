/**
 * @file llm-security-firewall.module.ts
 * @description NestJS module configuring [AI-FIREWALL-069]: LLM Prompt Injection, Secret Leakage & Jailbreak Defense Firewall.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { LlmSecurityFirewallService } from './llm-security-firewall.service';
import { LlmSecurityFirewallController } from './llm-security-firewall.controller';

@Module({
  controllers: [LlmSecurityFirewallController],
  providers: [LlmSecurityFirewallService],
  exports: [LlmSecurityFirewallService],
})
export class LlmSecurityFirewallModule {}
