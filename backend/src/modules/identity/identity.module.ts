import { Module } from '@nestjs/common';
import { VerifiableCredentialsService } from './verifiable-credentials.service';
import { IdentityController } from './identity.controller';

@Module({
  controllers: [IdentityController],
  providers: [VerifiableCredentialsService],
  exports: [VerifiableCredentialsService],
})
export class IdentityModule {}

