import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KemKeypairResponseDto {
  @ApiProperty({ description: 'ML-KEM-768 (Kyber-768) public key (1184 bytes base64)' })
  publicKey!: string;

  @ApiProperty({ description: 'ML-KEM-768 (Kyber-768) secret key (2400 bytes base64)' })
  secretKey!: string;

  @ApiProperty({ description: 'Algorithm identifier', example: 'ML-KEM-768' })
  algorithm!: string;

  @ApiProperty({ description: 'NIST Security Category', example: 3 })
  nistCategory!: number;
}

export class KemEncapsulateRequestDto {
  @ApiProperty({ description: 'Recipient ML-KEM-768 public key (base64)' })
  publicKey!: string;
}

export class KemEncapsulateResponseDto {
  @ApiProperty({ description: 'Ciphertext to transmit to recipient (1088 bytes base64)' })
  ciphertext!: string;

  @ApiProperty({ description: 'Derived shared secret (32 bytes base64)' })
  sharedSecret!: string;

  @ApiProperty({ description: 'Algorithm identifier', example: 'ML-KEM-768' })
  algorithm!: string;
}

export class KemDecapsulateRequestDto {
  @ApiProperty({ description: 'Ciphertext received from initiator (1088 bytes base64)' })
  ciphertext!: string;

  @ApiProperty({ description: 'Recipient ML-KEM-768 secret key (2400 bytes base64)' })
  secretKey!: string;
}

export class KemDecapsulateResponseDto {
  @ApiProperty({ description: 'Recovered shared secret (32 bytes base64)' })
  sharedSecret!: string;

  @ApiProperty({ description: 'Decapsulation success status', example: true })
  success!: boolean;
}

export class DsaKeypairResponseDto {
  @ApiProperty({ description: 'ML-DSA-65 (Dilithium-3) public key (1952 bytes base64)' })
  publicKey!: string;

  @ApiProperty({ description: 'ML-DSA-65 (Dilithium-3) secret key (4016 bytes base64)' })
  secretKey!: string;

  @ApiProperty({ description: 'Algorithm identifier', example: 'ML-DSA-65' })
  algorithm!: string;
}

export class HybridKeypairResponseDto {
  @ApiProperty({ description: 'Classical Ed25519 public key (32 bytes base64)' })
  classicalPublicKey!: string;

  @ApiProperty({ description: 'Classical Ed25519 secret key (64 bytes base64)' })
  classicalSecretKey!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 public key (1952 bytes base64)' })
  pqcPublicKey!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 secret key (4016 bytes base64)' })
  pqcSecretKey!: string;

  @ApiProperty({ description: 'Algorithm suite identifier', example: 'HYBRID_ED25519_ML_DSA_65' })
  algorithm!: string;
}

export class HybridSignRequestDto {
  @ApiProperty({ description: 'Plaintext payload or message to sign' })
  message!: string;

  @ApiProperty({ description: 'Classical Ed25519 secret key (base64)' })
  classicalSecretKey!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 secret key (base64)' })
  pqcSecretKey!: string;
}

export class HybridSignatureDto {
  @ApiProperty({ description: 'Classical Ed25519 signature (64 bytes base64)' })
  classicalSignature!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 signature (3293 bytes base64)' })
  pqcSignature!: string;

  @ApiProperty({ description: 'Algorithm identifier', example: 'HYBRID_ED25519_ML_DSA_65' })
  algorithm!: string;

  @ApiProperty({ description: 'Total combined signature size in bytes' })
  totalSignatureBytes!: number;
}

export class HybridVerifyRequestDto {
  @ApiProperty({ description: 'Original message signed' })
  message!: string;

  @ApiProperty({ description: 'Classical Ed25519 signature (base64)' })
  classicalSignature!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 signature (base64)' })
  pqcSignature!: string;

  @ApiProperty({ description: 'Classical Ed25519 public key (base64)' })
  classicalPublicKey!: string;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 public key (base64)' })
  pqcPublicKey!: string;
}

export class HybridVerifyResponseDto {
  @ApiProperty({ description: 'Overall hybrid validity (both signatures must pass)', example: true })
  valid!: boolean;

  @ApiProperty({ description: 'Classical Ed25519 signature validity', example: true })
  classicalValid!: boolean;

  @ApiProperty({ description: 'Post-Quantum ML-DSA-65 signature validity', example: true })
  pqcValid!: boolean;

  @ApiProperty({ description: 'Algorithm validated', example: 'HYBRID_ED25519_ML_DSA_65' })
  algorithm!: string;
}

export class BenchmarkMetricsDto {
  @ApiProperty({ description: 'Algorithm name' })
  algorithm!: string;

  @ApiProperty({ description: 'Key generation latency in ms' })
  keygenMs!: number;

  @ApiProperty({ description: 'Primary operation (encapsulation or sign) latency in ms' })
  primaryOpMs!: number;

  @ApiProperty({ description: 'Secondary operation (decapsulation or verify) latency in ms' })
  secondaryOpMs!: number;

  @ApiProperty({ description: 'Public key size in bytes' })
  publicKeyBytes!: number;

  @ApiProperty({ description: 'Secret key size in bytes' })
  secretKeyBytes!: number;

  @ApiProperty({ description: 'Output artifact size in bytes (ciphertext or signature)' })
  artifactBytes!: number;

  @ApiProperty({ description: 'Quantum resistance guarantee' })
  quantumResistant!: boolean;
}

export class PqcBenchmarkReportDto {
  @ApiProperty({ type: [BenchmarkMetricsDto], description: 'Detailed benchmark comparison' })
  results!: BenchmarkMetricsDto[];

  @ApiProperty({ description: 'CPU hardware architecture' })
  architecture!: string;

  @ApiProperty({ description: 'Node.js runtime version' })
  nodeVersion!: string;

  @ApiProperty({ description: 'Timestamp of benchmark execution' })
  timestamp!: string;
}
