/**
 * @file websocket-drainage-manager.module.ts
 * @description NestJS module configuring [NET-DRAIN-084]: Zero-Downtime WebSocket Socket Rebalancing & Graceful Connection Drainage on Cloud Deployments.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebSocketDrainageManagerService } from './websocket-drainage-manager.service';
import { WebSocketDrainageManagerController } from './websocket-drainage-manager.controller';

@Module({
  controllers: [WebSocketDrainageManagerController],
  providers: [WebSocketDrainageManagerService],
  exports: [WebSocketDrainageManagerService],
})
export class WebSocketDrainageManagerModule {}
