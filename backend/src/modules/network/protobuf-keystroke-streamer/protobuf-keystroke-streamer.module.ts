/**
 * @file protobuf-keystroke-streamer.module.ts
 * @description NestJS module configuring [NET-PROTOBUF-083]: Binary Protocol Buffer (Protobuf v3) Keystroke Diff Streaming with 75% Bandwidth Reduction.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ProtobufKeystrokeStreamerService } from './protobuf-keystroke-streamer.service';
import { ProtobufKeystrokeStreamerController } from './protobuf-keystroke-streamer.controller';

@Module({
  controllers: [ProtobufKeystrokeStreamerController],
  providers: [ProtobufKeystrokeStreamerService],
  exports: [ProtobufKeystrokeStreamerService],
})
export class ProtobufKeystrokeStreamerModule {}
