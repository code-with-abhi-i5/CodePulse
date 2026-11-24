/**
 * @file highthroughput-eventsourced-audit-ledger.module.ts
 * @description NestJS module configuring [EVENT-KAFKA-121]: High-Throughput Event-Sourced Audit Ledger with Redpanda / Apache Kafka Storage.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { HighthroughputEventsourcedAuditLedgerService } from './highthroughput-eventsourced-audit-ledger.service';
import { HighthroughputEventsourcedAuditLedgerController } from './highthroughput-eventsourced-audit-ledger.controller';

@Module({
  controllers: [HighthroughputEventsourcedAuditLedgerController],
  providers: [HighthroughputEventsourcedAuditLedgerService],
  exports: [HighthroughputEventsourcedAuditLedgerService],
})
export class HighthroughputEventsourcedAuditLedgerModule {}
