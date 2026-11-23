/**
 * @file webtransport-quic-relay.module.ts
 * @description NestJS module configuring [NET-QUIC-081]: Global Anycast UDP WebTransport / QUIC Edge Relay Mesh with Sub-5ms Packet Multiplexing.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { WebTransportQuicRelayService } from './webtransport-quic-relay.service';
import { WebTransportQuicRelayController } from './webtransport-quic-relay.controller';

@Module({
  controllers: [WebTransportQuicRelayController],
  providers: [WebTransportQuicRelayService],
  exports: [WebTransportQuicRelayService],
})
export class WebTransportQuicRelayModule {}
