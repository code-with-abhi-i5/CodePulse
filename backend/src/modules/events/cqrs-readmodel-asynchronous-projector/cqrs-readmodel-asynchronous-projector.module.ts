/**
 * @file cqrs-readmodel-asynchronous-projector.module.ts
 * @description NestJS module configuring [EVENT-CQRS-122]: CQRS Read-Model Asynchronous Projector with Eventual Consistency Self-Healing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CqrsReadmodelAsynchronousProjectorService } from './cqrs-readmodel-asynchronous-projector.service';
import { CqrsReadmodelAsynchronousProjectorController } from './cqrs-readmodel-asynchronous-projector.controller';

@Module({
  controllers: [CqrsReadmodelAsynchronousProjectorController],
  providers: [CqrsReadmodelAsynchronousProjectorService],
  exports: [CqrsReadmodelAsynchronousProjectorService],
})
export class CqrsReadmodelAsynchronousProjectorModule {}
