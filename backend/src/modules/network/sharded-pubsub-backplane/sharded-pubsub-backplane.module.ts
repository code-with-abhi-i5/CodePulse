/**
 * @file sharded-pubsub-backplane.module.ts
 * @description NestJS module configuring [NET-SHARD-CHANNEL-089]: Sharded WebSocket Room Pub/Sub Backplane with Multi-Node Redis Cluster Streams.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ShardedPubSubBackplaneService } from './sharded-pubsub-backplane.service';
import { ShardedPubSubBackplaneController } from './sharded-pubsub-backplane.controller';

@Module({
  controllers: [ShardedPubSubBackplaneController],
  providers: [ShardedPubSubBackplaneService],
  exports: [ShardedPubSubBackplaneService],
})
export class ShardedPubSubBackplaneModule {}
