/**
 * @file anycast-ingress-gateway.module.ts
 * @description NestJS module configuring [NET-ANYCAST-094]: BGP Anycast Edge Ingress Gateway with Automatic RTT-Based Client Geolocation.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { AnycastIngressGatewayService } from './anycast-ingress-gateway.service';
import { AnycastIngressGatewayController } from './anycast-ingress-gateway.controller';

@Module({
  controllers: [AnycastIngressGatewayController],
  providers: [AnycastIngressGatewayService],
  exports: [AnycastIngressGatewayService],
})
export class AnycastIngressGatewayModule {}
