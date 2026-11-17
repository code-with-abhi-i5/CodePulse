import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GeoDnsService } from './geo-dns.service';

@Module({
  controllers: [HealthController],
  providers: [GeoDnsService],
  exports: [GeoDnsService],
})
export class HealthModule {}
