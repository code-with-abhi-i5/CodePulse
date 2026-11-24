/**
 * @file webauthn-fido2-passkey-server.module.ts
 * @description NestJS module configuring [SEC-PASSKEY-107]: WebAuthn / FIDO2 Passkey Server with Cryptographic Biometric Challenge Verification.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebauthnFido2PasskeyServerService } from './webauthn-fido2-passkey-server.service';
import { WebauthnFido2PasskeyServerController } from './webauthn-fido2-passkey-server.controller';

@Module({
  controllers: [WebauthnFido2PasskeyServerController],
  providers: [WebauthnFido2PasskeyServerService],
  exports: [WebauthnFido2PasskeyServerService],
})
export class WebauthnFido2PasskeyServerModule {}
