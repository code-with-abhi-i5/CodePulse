import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBridgeService } from './event-bridge.service';

@Module({
  imports: [ConfigModule],
  providers: [EventBridgeService],
  exports: [EventBridgeService],
})
export class MessagingModule {}

