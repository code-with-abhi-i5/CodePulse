/**
 * @file ast-taint-analyzer.module.ts
 * @description NestJS module configuring [AI-TAINT-079]: AST-Based Inter-Procedural Taint Analysis Engine for Automated Security Vulnerability Detection.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AstTaintAnalyzerService } from './ast-taint-analyzer.service';
import { AstTaintAnalyzerController } from './ast-taint-analyzer.controller';

@Module({
  controllers: [AstTaintAnalyzerController],
  providers: [AstTaintAnalyzerService],
  exports: [AstTaintAnalyzerService],
})
export class AstTaintAnalyzerModule {}
