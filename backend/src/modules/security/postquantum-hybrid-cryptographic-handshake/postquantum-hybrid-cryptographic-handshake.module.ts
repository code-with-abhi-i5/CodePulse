/**
 * @file postquantum-hybrid-cryptographic-handshake.module.ts
 * @description NestJS module configuring [SEC-PQ-101]: Post-Quantum Hybrid Cryptographic Handshake Engine (CRYSTALS-Kyber-768 & Dilithium).
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PostquantumHybridCryptographicHandshakeService } from './postquantum-hybrid-cryptographic-handshake.service';
import { PostquantumHybridCryptographicHandshakeController } from './postquantum-hybrid-cryptographic-handshake.controller';

@Module({
  controllers: [PostquantumHybridCryptographicHandshakeController],
  providers: [PostquantumHybridCryptographicHandshakeService],
  exports: [PostquantumHybridCryptographicHandshakeService],
})
export class PostquantumHybridCryptographicHandshakeModule {}
