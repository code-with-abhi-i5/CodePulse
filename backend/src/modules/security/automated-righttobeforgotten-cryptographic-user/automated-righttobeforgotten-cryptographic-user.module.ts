/**
 * @file automated-righttobeforgotten-cryptographic-user.module.ts
 * @description NestJS module configuring [SEC-GDPR-105]: Automated Right-to-be-Forgotten Cryptographic User Shredding Pipeline with Verifiable PDF Certificates.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AutomatedRighttobeforgottenCryptographicUserService } from './automated-righttobeforgotten-cryptographic-user.service';
import { AutomatedRighttobeforgottenCryptographicUserController } from './automated-righttobeforgotten-cryptographic-user.controller';

@Module({
  controllers: [AutomatedRighttobeforgottenCryptographicUserController],
  providers: [AutomatedRighttobeforgottenCryptographicUserService],
  exports: [AutomatedRighttobeforgottenCryptographicUserService],
})
export class AutomatedRighttobeforgottenCryptographicUserModule {}
