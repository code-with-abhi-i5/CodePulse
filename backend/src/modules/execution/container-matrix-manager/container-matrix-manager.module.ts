/**
 * @file container-matrix-manager.module.ts
 * @description NestJS module configuring [SANDBOX-CONTAINER-MATRIX-060]: Polyglot Compiler Toolchain Matrix Manager with Pre-Cached Container Base Layers.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ContainerMatrixManagerService } from './container-matrix-manager.service';
import { ContainerMatrixManagerController } from './container-matrix-manager.controller';

@Module({
  controllers: [ContainerMatrixManagerController],
  providers: [ContainerMatrixManagerService],
  exports: [ContainerMatrixManagerService],
})
export class ContainerMatrixManagerModule {}
