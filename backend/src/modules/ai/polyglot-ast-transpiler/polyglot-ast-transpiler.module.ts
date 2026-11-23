/**
 * @file polyglot-ast-transpiler.module.ts
 * @description NestJS module configuring [AI-TRANSPILER-065]: Polyglot Code Transpiler with Semantic Equivalence Verification & Idiomatic AST Refactoring.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PolyglotAstTranspilerService } from './polyglot-ast-transpiler.service';
import { PolyglotAstTranspilerController } from './polyglot-ast-transpiler.controller';

@Module({
  controllers: [PolyglotAstTranspilerController],
  providers: [PolyglotAstTranspilerService],
  exports: [PolyglotAstTranspilerService],
})
export class PolyglotAstTranspilerModule {}
