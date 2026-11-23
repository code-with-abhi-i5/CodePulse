/**
 * @file hardened-flag-injector.module.ts
 * @description NestJS module configuring [SANDBOX-FLAGS-054]: Dynamic Hardened Compiler Flag Injector Defending Against ROP/JOP Binary Exploits.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { HardenedFlagInjectorService } from './hardened-flag-injector.service';
import { HardenedFlagInjectorController } from './hardened-flag-injector.controller';

@Module({
  controllers: [HardenedFlagInjectorController],
  providers: [HardenedFlagInjectorService],
  exports: [HardenedFlagInjectorService],
})
export class HardenedFlagInjectorModule {}
