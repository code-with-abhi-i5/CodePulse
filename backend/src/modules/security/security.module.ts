import { Module } from '@nestjs/common';
import { AcmeCertService } from './acme-cert.service';
import { TlsReloaderService } from '../../common/services/tls-reloader.service';

@Module({
  providers: [AcmeCertService, TlsReloaderService],
  exports: [AcmeCertService, TlsReloaderService],
})
export class SecurityModule {}
