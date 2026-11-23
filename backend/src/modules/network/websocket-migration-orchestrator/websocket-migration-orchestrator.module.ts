/**
 * @file websocket-migration-orchestrator.module.ts
 * @description NestJS module configuring [NET-MIGRATION-100]: Live WebSocket Connection Handshake Migration for Zero-Disconnect Pod Rolling Restarts.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebSocketMigrationOrchestratorService } from './websocket-migration-orchestrator.service';
import { WebSocketMigrationOrchestratorController } from './websocket-migration-orchestrator.controller';

@Module({
  controllers: [WebSocketMigrationOrchestratorController],
  providers: [WebSocketMigrationOrchestratorService],
  exports: [WebSocketMigrationOrchestratorService],
})
export class WebSocketMigrationOrchestratorModule {}
