import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as os from 'os';
import {
  KemKeypairResponseDto,
  KemEncapsulateResponseDto,
  KemDecapsulateResponseDto,
  DsaKeypairResponseDto,
  HybridKeypairResponseDto,
  HybridSignatureDto,
  HybridVerifyResponseDto,
  PqcBenchmarkReportDto,
  BenchmarkMetricsDto,
} from './dto/post-quantum.dto';

// NIST FIPS 203 & FIPS 204 Parameter Constants
export const ML_KEM_768 = {
  name: 'ML-KEM-768',
  category: 3, // NIST Level 3 (AES-192 equivalent)
  publicKeyBytes: 1184,
  secretKeyBytes: 2400,
  ciphertextBytes: 1088,
  sharedSecretBytes: 32,
  q: 3329,
  k: 3,
};

export const ML_DSA_65 = {
  name: 'ML-DSA-65',
  category: 3, // NIST Level 3 (Dilithium-3)
  publicKeyBytes: 1952,
  secretKeyBytes: 4016,
  signatureBytes: 3293,
};

// Static calibrated matrix A for LWE lattice computations
const LWE_A = [
  [120, 450, 890],
  [2100, 310, 1500],
  [45, 1200, 2300],
];
const LWE_S = [1, -1, 2];
const LWE_E = [0, 1, -1];
const LWE_R = [-1, 1, 0];
const LWE_E1 = [1, 0, -1];
const LWE_E2 = 1;
