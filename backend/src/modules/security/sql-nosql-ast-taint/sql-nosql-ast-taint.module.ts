/**
 * @file sql-nosql-ast-taint.module.ts
 * @description NestJS module configuring [SEC-AST-SQLI-119]: SQL & NoSQL AST Taint Firewall Blocking Dynamic Raw Query Interpolation in Backend Services.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SqlNosqlAstTaintService } from './sql-nosql-ast-taint.service';
import { SqlNosqlAstTaintController } from './sql-nosql-ast-taint.controller';

@Module({
  controllers: [SqlNosqlAstTaintController],
  providers: [SqlNosqlAstTaintService],
  exports: [SqlNosqlAstTaintService],
})
export class SqlNosqlAstTaintModule {}
