/**
 * @file zero-copy-serializer.module.ts
 * @description NestJS module configuring [NET-SERIALIZER-092]: Zero-Copy FlatBuffers / Cap\'n Proto Serialization Engine for Real-Time Esports Packets.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ZeroCopySerializerService } from './zero-copy-serializer.service';
import { ZeroCopySerializerController } from './zero-copy-serializer.controller';

@Module({
  controllers: [ZeroCopySerializerController],
  providers: [ZeroCopySerializerService],
  exports: [ZeroCopySerializerService],
})
export class ZeroCopySerializerModule {}
