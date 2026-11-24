import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DiscordWebhookService } from './discord-webhook.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationOutboxService } from './notification-outbox.service';
import { TemplateCompilerService } from './template-compiler.service';
import { NotificationBatchDispatcherService } from './notification-batch-dispatcher.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    DiscordWebhookService,
    NotificationOutboxService,
    TemplateCompilerService,
    NotificationBatchDispatcherService,
  ],
  exports: [
    NotificationsService,
    DiscordWebhookService,
    NotificationOutboxService,
    TemplateCompilerService,
    NotificationBatchDispatcherService,
  ],
})
export class NotificationsModule {}
