/**
 * @file signal-protocol-endtoend-encrypted.module.ts
 * @description NestJS module configuring [SEC-DOUBLE-RATCHET-111]: Signal Protocol End-to-End Encrypted (E2EE) Team Messaging with Double Ratchet Algorithm.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SignalProtocolEndtoendEncryptedService } from './signal-protocol-endtoend-encrypted.service';
import { SignalProtocolEndtoendEncryptedController } from './signal-protocol-endtoend-encrypted.controller';

@Module({
  controllers: [SignalProtocolEndtoendEncryptedController],
  providers: [SignalProtocolEndtoendEncryptedService],
  exports: [SignalProtocolEndtoendEncryptedService],
})
export class SignalProtocolEndtoendEncryptedModule {}
