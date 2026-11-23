/**
 * @file ast-pre-screener.module.ts
 * @description NestJS module configuring [SANDBOX-AST-SCREEN-057]: Static Analysis AST Pre-Screener Rejecting Malicious System Imports & Native Module Bypasses.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AstPreScreenerService } from './ast-pre-screener.service';
import { AstPreScreenerController } from './ast-pre-screener.controller';

@Module({
  controllers: [AstPreScreenerController],
  providers: [AstPreScreenerService],
  exports: [AstPreScreenerService],
})
export class AstPreScreenerModule {}
