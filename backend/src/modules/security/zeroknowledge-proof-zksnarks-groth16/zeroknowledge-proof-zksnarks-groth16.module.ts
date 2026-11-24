/**
 * @file zeroknowledge-proof-zksnarks-groth16.module.ts
 * @description NestJS module configuring [SEC-ZKP-102]: Zero-Knowledge Proof (zk-SNARKs / Groth16) Challenge Verifier Proving Output Without Code Leak.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { ZeroknowledgeProofZksnarksGroth16Service } from './zeroknowledge-proof-zksnarks-groth16.service';
import { ZeroknowledgeProofZksnarksGroth16Controller } from './zeroknowledge-proof-zksnarks-groth16.controller';

@Module({
  controllers: [ZeroknowledgeProofZksnarksGroth16Controller],
  providers: [ZeroknowledgeProofZksnarksGroth16Service],
  exports: [ZeroknowledgeProofZksnarksGroth16Service],
})
export class ZeroknowledgeProofZksnarksGroth16Module {}
