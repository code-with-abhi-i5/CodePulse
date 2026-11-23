/**
 * @file netns-ebpf-guard.module.ts
 * @description NestJS module configuring [SANDBOX-NETNS-049]: Network Namespace Isolation with eBPF Packet Drop for Zero-Network Execution Guarantees.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { NetnsEbpfGuardService } from './netns-ebpf-guard.service';
import { NetnsEbpfGuardController } from './netns-ebpf-guard.controller';

@Module({
  controllers: [NetnsEbpfGuardController],
  providers: [NetnsEbpfGuardService],
  exports: [NetnsEbpfGuardService],
})
export class NetnsEbpfGuardModule {}
