import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { WebhookConsumer } from './webhook.consumer';
import { EndpointCircuitBreakerService } from './endpoint-circuit-breaker.service';
import { WebhookDeliveryEngineService } from './webhook-delivery-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'webhook-delivery',
    }),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhookDispatcherService,
    WebhookConsumer,
    EndpointCircuitBreakerService,
    WebhookDeliveryEngineService,
  ],
  exports: [
    WebhookDispatcherService,
    WebhookConsumer,
    EndpointCircuitBreakerService,
    WebhookDeliveryEngineService,
  ],
})
export class WebhooksModule {}
