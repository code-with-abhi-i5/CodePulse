import { Module } from '@nestjs/common';
import { OpaService } from './opa.service';
import { TyposquatScannerService } from './typosquat-scanner.service';
import { PasteVelocityAnalyzerService } from './paste-velocity-analyzer.service';
import { AntiCheatTelemetryService } from './anti-cheat-telemetry.service';
import { EbpfSidecarService } from './ebpf-sidecar.service';

@Module({
  providers: [
    OpaService,
    TyposquatScannerService,
    PasteVelocityAnalyzerService,
    AntiCheatTelemetryService,
    EbpfSidecarService,
  ],
  exports: [
    OpaService,
    TyposquatScannerService,
    PasteVelocityAnalyzerService,
    AntiCheatTelemetryService,
    EbpfSidecarService,
  ],
})
export class SecModule {}
