import { Module } from '@nestjs/common';
import { ZkpVerifierService } from './zkp-verifier.service';
import { HomomorphicTelemetryService } from './homomorphic-telemetry.service';
import { ZkSnarkVerifierService } from './zk-snark-verifier.service';
import { CryptoController } from './crypto.controller';
import { PostQuantumService } from './post-quantum.service';

@Module({
  controllers: [CryptoController],
import { PostQuantumService } from './post-quantum.service';
import { CryptoController } from './crypto.controller';

@Module({
  controllers: [CryptoController],
  providers: [ZkpVerifierService, HomomorphicTelemetryService, ZkSnarkVerifierService, PostQuantumService],
  exports: [ZkpVerifierService, HomomorphicTelemetryService, ZkSnarkVerifierService, PostQuantumService],
})
})
export class CryptoModule {}
