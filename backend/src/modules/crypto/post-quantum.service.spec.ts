import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  PostQuantumService,
  ML_KEM_768,
  ML_DSA_65,
} from './post-quantum.service';

describe('PostQuantumService (#548 ML-KEM / Kyber & ML-DSA / Dilithium)', () => {
  let service: PostQuantumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostQuantumService],
    }).compile();

    service = module.get<PostQuantumService>(PostQuantumService);
  });

  describe('ML-KEM-768 (Crystals-Kyber Key Encapsulation)', () => {
    it('generates standard ML-KEM-768 keypairs matching NIST byte specifications', () => {
      const keys = service.generateKemKeyPair();

      const pkBytes = Buffer.from(keys.publicKey, 'base64');
      const skBytes = Buffer.from(keys.secretKey, 'base64');

      expect(pkBytes.length).toBe(ML_KEM_768.publicKeyBytes); // 1184 bytes
      expect(skBytes.length).toBe(ML_KEM_768.secretKeyBytes); // 2400 bytes
      expect(keys.algorithm).toBe('ML-KEM-768');
      expect(keys.nistCategory).toBe(3);
    });

    it('encapsulates and decapsulates identical 256-bit symmetric shared secrets in < 5ms', () => {
      const keys = service.generateKemKeyPair();

      const startEncap = performance.now();
      const encap = service.encapsulate(keys.publicKey);
      const encapDuration = performance.now() - startEncap;

      const ctBytes = Buffer.from(encap.ciphertext, 'base64');
      const ssBytes = Buffer.from(encap.sharedSecret, 'base64');

      expect(ctBytes.length).toBe(ML_KEM_768.ciphertextBytes); // 1088 bytes
      expect(ssBytes.length).toBe(ML_KEM_768.sharedSecretBytes); // 32 bytes
      expect(encapDuration).toBeLessThan(5); // under 5ms benchmark requirement

      const startDecap = performance.now();
      const decap = service.decapsulate(encap.ciphertext, keys.secretKey);
      const decapDuration = performance.now() - startDecap;

      expect(decapDuration).toBeLessThan(5); // under 5ms benchmark requirement
      expect(decap.success).toBe(true);
      expect(decap.sharedSecret).toBe(encap.sharedSecret);
    });

    it('rejects tampered ciphertext via Fujisaki-Okamoto CCA transform (returns pseudorandom reject secret)', () => {
      const keys = service.generateKemKeyPair();
      const encap = service.encapsulate(keys.publicKey);

      // Corrupt 1 byte in ciphertext
      const tamperedCt = Buffer.from(encap.ciphertext, 'base64');
      tamperedCt[tamperedCt.length - 1] ^= 0xff;

      const decap = service.decapsulate(tamperedCt.toString('base64'), keys.secretKey);
      expect(decap.success).toBe(false);
      expect(decap.sharedSecret).not.toBe(encap.sharedSecret);
    });

    it('rejects invalid key lengths with BadRequestException', () => {
      expect(() => service.encapsulate('shortKey')).toThrow(BadRequestException);
      expect(() => service.decapsulate('shortCt', 'shortSk')).toThrow(BadRequestException);
    });
  });

  describe('ML-DSA-65 (Crystals-Dilithium Digital Signatures)', () => {
    it('generates standard ML-DSA-65 keypair matching NIST byte specifications', () => {
      const keys = service.generateDsaKeyPair();

      const pkBytes = Buffer.from(keys.publicKey, 'base64');
      const skBytes = Buffer.from(keys.secretKey, 'base64');

      expect(pkBytes.length).toBe(ML_DSA_65.publicKeyBytes); // 1952 bytes
      expect(skBytes.length).toBe(ML_DSA_65.secretKeyBytes); // 4016 bytes
      expect(keys.algorithm).toBe('ML-DSA-65');
    });

    it('signs and verifies messages with ML-DSA-65 in < 5ms', () => {
      const keys = service.generateDsaKeyPair();
      const payload = 'CodePulse Tournament Certificate: Player 1st Place 2026';

      const startSign = performance.now();
      const signature = service.signDsa(payload, keys.secretKey);
      const signDuration = performance.now() - startSign;

      const sigBytes = Buffer.from(signature, 'base64');
      expect(sigBytes.length).toBe(ML_DSA_65.signatureBytes); // 3293 bytes
      expect(signDuration).toBeLessThan(5);

      const startVerify = performance.now();
      const isValid = service.verifyDsa(payload, signature, keys.publicKey);
      const verifyDuration = performance.now() - startVerify;

      expect(isValid).toBe(true);
      expect(verifyDuration).toBeLessThan(5);

      // Fails on altered message
      expect(service.verifyDsa('Tampered Message', signature, keys.publicKey)).toBe(false);

      // Fails on corrupted signature
      const corruptedSig = Buffer.from(sigBytes);
      corruptedSig[0] ^= 0x01;
      expect(service.verifyDsa(payload, corruptedSig.toString('base64'), keys.publicKey)).toBe(false);
    });
  });

  describe('Hybrid Dual-Signature Mode (Ed25519 + ML-DSA-65)', () => {
    it('generates hybrid keypairs and signs with 0% false rejections', () => {
      const hybridKeys = service.generateHybridKeyPair();
      expect(hybridKeys.algorithm).toBe('HYBRID_ED25519_ML_DSA_65');

      const message = 'JWT_API_TOKEN_CLAIMS_SUB_123456_EXP_2026';
      const signature = service.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      expect(signature.algorithm).toBe('HYBRID_ED25519_ML_DSA_65');
      expect(signature.totalSignatureBytes).toBe(64 + ML_DSA_65.signatureBytes);

      const verification = service.verifyHybrid(
        message,
        signature.classicalSignature,
        signature.pqcSignature,
        hybridKeys.classicalPublicKey,
        hybridKeys.pqcPublicKey,
      );

      expect(verification.valid).toBe(true);
      expect(verification.classicalValid).toBe(true);
      expect(verification.pqcValid).toBe(true);
    });

    it('rejects hybrid signature if classical component is tampered', () => {
      const hybridKeys = service.generateHybridKeyPair();
      const message = 'Valid Payload';
      const signature = service.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      const corruptedClassicalSig = Buffer.alloc(64, 1).toString('base64');
      const verification = service.verifyHybrid(
        message,
        corruptedClassicalSig,
        signature.pqcSignature,
        hybridKeys.classicalPublicKey,
        hybridKeys.pqcPublicKey,
      );

      expect(verification.valid).toBe(false);
      expect(verification.classicalValid).toBe(false);
      expect(verification.pqcValid).toBe(true);
    });

    it('rejects hybrid signature if post-quantum component is tampered', () => {
      const hybridKeys = service.generateHybridKeyPair();
      const message = 'Valid Payload';
      const signature = service.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      const corruptedPqcSig = Buffer.alloc(ML_DSA_65.signatureBytes, 2).toString('base64');
      const verification = service.verifyHybrid(
        message,
        signature.classicalSignature,
        corruptedPqcSig,
        hybridKeys.classicalPublicKey,
        hybridKeys.pqcPublicKey,
      );

      expect(verification.valid).toBe(false);
      expect(verification.classicalValid).toBe(true);
      expect(verification.pqcValid).toBe(false);
    });
  });

  describe('Post-Quantum Latency & Overhead Benchmarks', () => {
    it('executes performance benchmark report across all 4 cryptographic suites', () => {
      const report = service.benchmarkAlgorithms(5);

      expect(report.results.length).toBe(4);
      expect(report.architecture).toBeDefined();
      expect(report.nodeVersion).toBeDefined();

      const kemResult = report.results.find((r) => r.algorithm.includes('ML-KEM-768'));
      expect(kemResult).toBeDefined();
      expect(kemResult?.primaryOpMs).toBeLessThan(5); // under 5ms
      expect(kemResult?.secondaryOpMs).toBeLessThan(5); // under 5ms
      expect(kemResult?.quantumResistant).toBe(true);

      const hybridResult = report.results.find((r) => r.algorithm.includes('Hybrid'));
      expect(hybridResult).toBeDefined();
      expect(hybridResult?.quantumResistant).toBe(true);
      expect(hybridResult?.artifactBytes).toBeGreaterThan(3000);
    });
  });
});

