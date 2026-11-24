/**
 * @file delta-compression-scrubber.module.ts
 * @description NestJS module configuring [NET-SCRUBBER-091]: Lossless Delta Compression Scrubber for Instantaneous Keystroke State Reconstruction.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { DeltaCompressionScrubberService } from './delta-compression-scrubber.service';
import { DeltaCompressionScrubberController } from './delta-compression-scrubber.controller';

@Module({
  controllers: [DeltaCompressionScrubberController],
  providers: [DeltaCompressionScrubberService],
  exports: [DeltaCompressionScrubberService],
})
export class DeltaCompressionScrubberModule {}
