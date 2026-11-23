/**
 * @file cgroup-telemetry-exporter.module.ts
 * @description NestJS module configuring [SANDBOX-METRICS-058]: High-Frequency Cgroup v2 Telemetry Exporter for Real-Time Execution Resource Graphing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CgroupTelemetryExporterService } from './cgroup-telemetry-exporter.service';
import { CgroupTelemetryExporterController } from './cgroup-telemetry-exporter.controller';

@Module({
  controllers: [CgroupTelemetryExporterController],
  providers: [CgroupTelemetryExporterService],
  exports: [CgroupTelemetryExporterService],
})
export class CgroupTelemetryExporterModule {}
