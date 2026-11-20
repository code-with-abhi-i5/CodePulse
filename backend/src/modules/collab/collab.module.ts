import { Module } from '@nestjs/common';
import { CrdtSyncService } from './crdt-sync.service';
import { CollabGateway } from './collab.gateway';

@Module({
  providers: [CrdtSyncService, CollabGateway],
  exports: [CrdtSyncService],
})
export class CollabModule {}

