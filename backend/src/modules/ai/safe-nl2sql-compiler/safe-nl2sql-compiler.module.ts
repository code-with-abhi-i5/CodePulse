/**
 * @file safe-nl2sql-compiler.module.ts
 * @description NestJS module configuring [AI-NL2SQL-074]: Natural Language to Safe PostgreSQL Compiler with AST Schema Validation & Read-Only Sandbox.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SafeNl2SqlCompilerService } from './safe-nl2sql-compiler.service';
import { SafeNl2SqlCompilerController } from './safe-nl2sql-compiler.controller';

@Module({
  controllers: [SafeNl2SqlCompilerController],
  providers: [SafeNl2SqlCompilerService],
  exports: [SafeNl2SqlCompilerService],
})
export class SafeNl2SqlCompilerModule {}
