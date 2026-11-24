/**
 * @file cryptographic-w3c-verifiable-credential.module.ts
 * @description NestJS module configuring [SEC-VC-BADGE-112]: Cryptographic W3C Verifiable Credential Badge Exporter with ECDSA Signatures & QR Code.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { CryptographicW3cVerifiableCredentialService } from './cryptographic-w3c-verifiable-credential.service';
import { CryptographicW3cVerifiableCredentialController } from './cryptographic-w3c-verifiable-credential.controller';

@Module({
  controllers: [CryptographicW3cVerifiableCredentialController],
  providers: [CryptographicW3cVerifiableCredentialService],
  exports: [CryptographicW3cVerifiableCredentialService],
})
export class CryptographicW3cVerifiableCredentialModule {}
