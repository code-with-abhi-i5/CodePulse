import { Module } from '@nestjs/common';
import { CdcService } from './cdc.service';
import { PulseController } from './pulse.controller';
import { QuicGateway } from './quic-gateway';
import { ClientTrackerService } from './client-tracker.service';
import { SocketLeakDetectorService } from './socket-leak-detector.service';

@Module({
  controllers: [PulseController],
  providers: [CdcService, QuicGateway, ClientTrackerService, SocketLeakDetectorService],
  exports: [CdcService, QuicGateway, ClientTrackerService, SocketLeakDetectorService],
})
export class RealtimeModule {}
