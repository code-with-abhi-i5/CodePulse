/**
 * @file cryptographic-hmacsha256-webhook-signer.module.ts
 * @description NestJS module configuring [SEC-HMAC-WEBHOOK-118]: Cryptographic HMAC-SHA256 Webhook Signer with Timestamp Replay Attack Prevention.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CryptographicHmacsha256WebhookSignerService } from './cryptographic-hmacsha256-webhook-signer.service';
import { CryptographicHmacsha256WebhookSignerController } from './cryptographic-hmacsha256-webhook-signer.controller';

@Module({
  controllers: [CryptographicHmacsha256WebhookSignerController],
  providers: [CryptographicHmacsha256WebhookSignerService],
  exports: [CryptographicHmacsha256WebhookSignerService],
})
export class CryptographicHmacsha256WebhookSignerModule {}
