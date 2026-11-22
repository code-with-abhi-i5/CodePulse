import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZkpVerifierService } from './zkp-verifier.service';
import { ZkSnarkVerifierService } from './zk-snark-verifier.service';
import { PostQuantumService } from './post-quantum.service';
import {
  KemEncapsulateRequestDto,
  KemDecapsulateRequestDto,
  HybridSignRequestDto,
  HybridVerifyRequestDto,
} from './dto/post-quantum.dto';
import type { ZkProofSubmission } from './zk-snark-verifier.service';
import type {
  ZkpVerificationRequest,
  ZkpVerificationResult,
} from './zkp-verifier.service';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(
    private readonly zkpService: ZkpVerifierService,
    private readonly zkSnarkService: ZkSnarkVerifierService,
    private readonly pqcService: PostQuantumService,
  ) {}

  @Post('verify-zkp')
  @ApiOperation({
    summary: 'Verify Groth16 zk-SNARK proof and return cryptographically verifiable audit certificate',
  })
  async verifyGroth16Zkp(@Body() payload: any) {
    if (!payload) {
      throw new BadRequestException('Request body is required');
    }
    return this.zkSnarkService.verifyProof(payload);
  }

  @Post('verify-zkp-proof')
  @ApiOperation({
    summary:
      'Verify zk-SNARK (Groth16) Zero-Knowledge Proof for private code battles in < 5ms',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns cryptographic validity of the submitted ZKP proof',
  })
  async verifyZkpProof(
    @Body() payload: ZkpVerificationRequest,
  ): Promise<ZkpVerificationResult> {
    if (!payload) {
      throw new BadRequestException('Request body is required');
    }
    return this.zkpService.verifyZkpProof(payload);
  }

  @Get('vk/:problemId')
  @ApiOperation({
    summary: 'Get Groth16 verification key for an algorithmic problem circuit',
  })
  getVerificationKey(@Param('problemId') problemId: string) {
    const vk = this.zkpService.getVerificationKey(problemId);
    if (!vk) {
      throw new BadRequestException(`No verification key found for ${problemId}`);
    }
    return vk;
  }

  @Post('pqc/kem/keypair')
  @ApiOperation({ summary: 'Generate NIST ML-KEM-768 (Kyber-768) keypair' })
  generateKemKeypair() {
    return this.pqcService.generateKemKeyPair();
  }

  @Post('pqc/kem/encapsulate')
  @ApiOperation({ summary: 'Encapsulate 256-bit shared secret using ML-KEM-768' })
  encapsulateKem(@Body() dto: KemEncapsulateRequestDto) {
    if (!dto?.publicKey) throw new BadRequestException('publicKey is required');
    return this.pqcService.encapsulate(dto.publicKey);
  }

  @Post('pqc/kem/decapsulate')
  @ApiOperation({ summary: 'Decapsulate 256-bit shared secret using ML-KEM-768' })
  decapsulateKem(@Body() dto: KemDecapsulateRequestDto) {
    if (!dto?.ciphertext || !dto?.secretKey) {
      throw new BadRequestException('ciphertext and secretKey are required');
    }
    return this.pqcService.decapsulate(dto.ciphertext, dto.secretKey);
  }

  @Post('pqc/hybrid/keypair')
  @ApiOperation({ summary: 'Generate hybrid keypair (Ed25519 + ML-DSA-65 / Dilithium-3)' })
  generateHybridKeypair() {
    return this.pqcService.generateHybridKeyPair();
  }

  @Post('pqc/hybrid/sign')
  @ApiOperation({ summary: 'Sign message with hybrid dual-signature (Ed25519 + ML-DSA-65)' })
  signHybrid(@Body() dto: HybridSignRequestDto) {
    if (!dto?.message || !dto?.classicalSecretKey || !dto?.pqcSecretKey) {
      throw new BadRequestException('message, classicalSecretKey, and pqcSecretKey are required');
    }
    return this.pqcService.signHybrid(dto.message, dto.classicalSecretKey, dto.pqcSecretKey);
  }

  @Post('pqc/hybrid/verify')
  @ApiOperation({ summary: 'Verify hybrid dual-signature with 0% false rejections' })
  verifyHybrid(@Body() dto: HybridVerifyRequestDto) {
    if (
      !dto?.message ||
      !dto?.classicalSignature ||
      !dto?.pqcSignature ||
      !dto?.classicalPublicKey ||
      !dto?.pqcPublicKey
    ) {
      throw new BadRequestException('All signature and public key components are required');
    }
    return this.pqcService.verifyHybrid(
      dto.message,
      dto.classicalSignature,
      dto.pqcSignature,
      dto.classicalPublicKey,
      dto.pqcPublicKey,
    );
  }

  @Get('pqc/benchmark')
  @ApiOperation({ summary: 'Benchmark latency and byte overhead comparing Classical vs Post-Quantum vs Hybrid' })
  benchmarkPqc() {
    return this.pqcService.benchmarkAlgorithms();
  }
}
