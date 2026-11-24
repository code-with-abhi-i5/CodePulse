/**
 * @file aws-kms-hashicorp-vault.module.ts
 * @description NestJS module configuring [SEC-ENVELOPE-108]: AWS KMS / HashiCorp Vault Envelope Encryption Engine for Per-Tenant Data Isolation.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AwsKmsHashicorpVaultService } from './aws-kms-hashicorp-vault.service';
import { AwsKmsHashicorpVaultController } from './aws-kms-hashicorp-vault.controller';

@Module({
  controllers: [AwsKmsHashicorpVaultController],
  providers: [AwsKmsHashicorpVaultService],
  exports: [AwsKmsHashicorpVaultService],
})
export class AwsKmsHashicorpVaultModule {}
