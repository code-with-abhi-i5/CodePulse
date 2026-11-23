import { Module } from '@nestjs/common';
import { OpaService } from './opa.service';
import { TyposquatScannerService } from './typosquat-scanner.service';
import { EbpfSidecarService } from './ebpf-sidecar.service';

@Module({
  providers: [OpaService, TyposquatScannerService, EbpfSidecarService],
  exports: [OpaService, TyposquatScannerService, EbpfSidecarService],
})
export class SecModule {}
