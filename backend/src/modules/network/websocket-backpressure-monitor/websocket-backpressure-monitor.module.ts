/**
 * @file websocket-backpressure-monitor.module.ts
 * @description NestJS module configuring [NET-BACKPRESSURE-086]: WebSocket Buffer Backpressure Monitor with Automatic Event-Loop Throttle Dampening.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebSocketBackpressureMonitorService } from './websocket-backpressure-monitor.service';
import { WebSocketBackpressureMonitorController } from './websocket-backpressure-monitor.controller';

@Module({
  controllers: [WebSocketBackpressureMonitorController],
  providers: [WebSocketBackpressureMonitorService],
  exports: [WebSocketBackpressureMonitorService],
})
export class WebSocketBackpressureMonitorModule {}
