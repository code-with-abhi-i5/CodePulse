/**
 * @file ephemeral-spiffespire-mutual-tls.module.ts
 * @description NestJS module configuring [SEC-MTLS-109]: Ephemeral SPIFFE/SPIRE Mutual TLS (mTLS) Certificate Authority for Microservice Zero-Trust.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { EphemeralSpiffespireMutualTlsService } from './ephemeral-spiffespire-mutual-tls.service';
import { EphemeralSpiffespireMutualTlsController } from './ephemeral-spiffespire-mutual-tls.controller';

@Module({
  controllers: [EphemeralSpiffespireMutualTlsController],
  providers: [EphemeralSpiffespireMutualTlsService],
  exports: [EphemeralSpiffespireMutualTlsService],
})
export class EphemeralSpiffespireMutualTlsModule {}
