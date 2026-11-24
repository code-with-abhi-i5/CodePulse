/**
 * @file multiparty-computation-mpc-shamir.module.ts
 * @description NestJS module configuring [SEC-MPC-103]: Multi-Party Computation (MPC) Shamir Secret Sharing Key Vault for Zero-Trust Signing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { MultipartyComputationMpcShamirService } from './multiparty-computation-mpc-shamir.service';
import { MultipartyComputationMpcShamirController } from './multiparty-computation-mpc-shamir.controller';

@Module({
  controllers: [MultipartyComputationMpcShamirController],
  providers: [MultipartyComputationMpcShamirService],
  exports: [MultipartyComputationMpcShamirService],
})
export class MultipartyComputationMpcShamirModule {}
