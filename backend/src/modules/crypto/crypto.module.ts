import { Module } from '@nestjs/common';
import { ZkpVerifierService } from './zkp-verifier.service';
import { ZkSnarkVerifierService } from './zk-snark-verifier.service';
import { CryptoController } from './crypto.controller';
import { PostQuantumService } from './post-quantum.service';

@Module({
  controllers: [CryptoController],
  providers: [ZkpVerifierService, ZkSnarkVerifierService, PostQuantumService],
  exports: [ZkpVerifierService, ZkSnarkVerifierService, PostQuantumService],
})
export class CryptoModule {}

