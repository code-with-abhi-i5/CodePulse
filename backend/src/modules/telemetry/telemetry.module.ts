import { Module } from '@nestjs/common';
import { BatchEmitterService } from './batch-emitter.service';
import { MicroFlushBufferService } from './micro-flush-buffer.service';
import { TimeseriesIngestionService } from './timeseries-ingestion.service';
import { ScyllaDbTelemetryService } from './scylladb-telemetry.service';

@Module({
  providers: [
    BatchEmitterService,
    MicroFlushBufferService,
    TimeseriesIngestionService,
    ScyllaDbTelemetryService,
  ],
  exports: [
    BatchEmitterService,
    MicroFlushBufferService,
    TimeseriesIngestionService,
    ScyllaDbTelemetryService,
  ],
})
export class TelemetryModule {}
