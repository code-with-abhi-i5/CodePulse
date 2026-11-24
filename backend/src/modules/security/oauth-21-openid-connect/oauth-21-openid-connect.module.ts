/**
 * @file oauth-21-openid-connect.module.ts
 * @description NestJS module configuring [SEC-PKCE-114]: OAuth 2.1 & OpenID Connect (OIDC) Identity Provider with Cryptographic PKCE Enforcement.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { Oauth21OpenidConnectService } from './oauth-21-openid-connect.service';
import { Oauth21OpenidConnectController } from './oauth-21-openid-connect.controller';

@Module({
  controllers: [Oauth21OpenidConnectController],
  providers: [Oauth21OpenidConnectService],
  exports: [Oauth21OpenidConnectService],
})
export class Oauth21OpenidConnectModule {}
