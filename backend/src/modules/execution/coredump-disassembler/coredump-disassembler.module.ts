/**
 * @file coredump-disassembler.module.ts
 * @description NestJS module configuring [SANDBOX-COREDUMP-048]: Automated Core Dump & Crash Stack Trace Disassembler with DWARF Debug Symbol Extraction.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CoredumpDisassemblerService } from './coredump-disassembler.service';
import { CoredumpDisassemblerController } from './coredump-disassembler.controller';

@Module({
  controllers: [CoredumpDisassemblerController],
  providers: [CoredumpDisassemblerService],
  exports: [CoredumpDisassemblerService],
})
export class CoredumpDisassemblerModule {}
