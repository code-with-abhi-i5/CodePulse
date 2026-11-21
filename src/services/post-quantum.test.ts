import { describe, it, expect, beforeEach } from 'vitest';
import {
  PostQuantumClient,
  ML_KEM_768,
  ML_DSA_65,
} from './post-quantum';

describe('PostQuantumClient (#548 ML-KEM / Kyber & ML-DSA / Dilithium)', () => {
  let client: PostQuantumClient;

  beforeEach(() => {
    PostQuantumClient.resetInstance();
    client = PostQuantumClient.getInstance();
  });

  describe('ML-KEM-768 (Crystals-Kyber KEM)', () => {
    it('generates standard ML-KEM-768 keypair matching NIST specifications', () => {
      const keys = client.generateKemKeyPair();

      const pkBytes = Buffer.from(keys.publicKey, 'base64');
      const skBytes = Buffer.from(keys.secretKey, 'base64');

      expect(pkBytes.length).toBe(ML_KEM_768.publicKeyBytes); // 1184 bytes
      expect(skBytes.length).toBe(ML_KEM_768.secretKeyBytes); // 2400 bytes
      expect(keys.algorithm).toBe('ML-KEM-768');
      expect(keys.nistCategory).toBe(3);
    });

    it('encapsulates and decapsulates identical 256-bit symmetric shared secret in < 5ms', () => {
      const keys = client.generateKemKeyPair();

      const t0 = performance.now();
      const encap = client.encapsulate(keys.publicKey);
      const encapDuration = performance.now() - t0;

      const ctBytes = Buffer.from(encap.ciphertext, 'base64');
      const ssBytes = Buffer.from(encap.sharedSecret, 'base64');

      expect(ctBytes.length).toBe(ML_KEM_768.ciphertextBytes); // 1088 bytes
      expect(ssBytes.length).toBe(ML_KEM_768.sharedSecretBytes); // 32 bytes
      expect(encapDuration).toBeLessThan(5);

      const t1 = performance.now();
      const decap = client.decapsulate(encap.ciphertext, keys.secretKey);
      const decapDuration = performance.now() - t1;

      expect(decapDuration).toBeLessThan(5);
      expect(decap.success).toBe(true);
      expect(decap.sharedSecret).toBe(encap.sharedSecret);
    });

    it('rejects tampered ciphertext with pseudorandom rejection secret (CCA security)', () => {
      const keys = client.generateKemKeyPair();
      const encap = client.encapsulate(keys.publicKey);

      const tamperedCt = Buffer.from(encap.ciphertext, 'base64');
      tamperedCt[tamperedCt.length - 1] ^= 0xaa;

      const decap = client.decapsulate(tamperedCt.toString('base64'), keys.secretKey);
      expect(decap.success).toBe(false);
      expect(decap.sharedSecret).not.toBe(encap.sharedSecret);
    });
  });

  describe('ML-DSA-65 (Crystals-Dilithium Signatures)', () => {
    it('generates standard ML-DSA-65 keypair matching NIST specifications', () => {
      const keys = client.generateDsaKeyPair();

      const pkBytes = Buffer.from(keys.publicKey, 'base64');
      const skBytes = Buffer.from(keys.secretKey, 'base64');

      expect(pkBytes.length).toBe(ML_DSA_65.publicKeyBytes); // 1952 bytes
      expect(skBytes.length).toBe(ML_DSA_65.secretKeyBytes); // 4016 bytes
      expect(keys.algorithm).toBe('ML-DSA-65');
    });

    it('signs and verifies messages in < 5ms', () => {
      const keys = client.generateDsaKeyPair();
      const payload = 'CodePulse Quantum-Resistant API Authentication Token';

      const t0 = performance.now();
      const sig = client.signDsa(payload, keys.secretKey);
      const signDuration = performance.now() - t0;

      const sigBytes = Buffer.from(sig, 'base64');
      expect(sigBytes.length).toBe(ML_DSA_65.signatureBytes); // 3293 bytes
      expect(signDuration).toBeLessThan(5);

      const t1 = performance.now();
      const isValid = client.verifyDsa(payload, sig, keys.publicKey);
      const verifyDuration = performance.now() - t1;

      expect(isValid).toBe(true);
      expect(verifyDuration).toBeLessThan(5);

      // Fails on altered message
      expect(client.verifyDsa('Modified Payload', sig, keys.publicKey)).toBe(false);
    });
  });

  describe('Hybrid Dual-Signature Mode (Ed25519 + ML-DSA-65)', () => {
    it('creates and validates dual signatures with 0% false rejections', () => {
      const hybridKeys = client.generateHybridKeyPair();
      const message = 'CRITICAL_DEPLOYMENT_ACTION_AUTH_SIG';

      const signature = client.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      expect(signature.algorithm).toBe('HYBRID_ED25519_ML_DSA_65');
      expect(signature.totalSignatureBytes).toBe(64 + ML_DSA_65.signatureBytes);

      const verification = client.verifyHybrid(
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

    it('rejects verification if classical signature is tampered', () => {
      const hybridKeys = client.generateHybridKeyPair();
      const message = 'Secure Payload';
      const signature = client.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      const tamperedClassicalSig = Buffer.alloc(64, 5).toString('base64');
      const verification = client.verifyHybrid(
        message,
        tamperedClassicalSig,
        signature.pqcSignature,
        hybridKeys.classicalPublicKey,
        hybridKeys.pqcPublicKey,
      );

      expect(verification.valid).toBe(false);
      expect(verification.classicalValid).toBe(false);
      expect(verification.pqcValid).toBe(true);
    });

    it('rejects verification if post-quantum signature is tampered', () => {
      const hybridKeys = client.generateHybridKeyPair();
      const message = 'Secure Payload';
      const signature = client.signHybrid(
        message,
        hybridKeys.classicalSecretKey,
        hybridKeys.pqcSecretKey,
      );

      const tamperedPqcSig = Buffer.alloc(ML_DSA_65.signatureBytes, 9).toString('base64');
      const verification = client.verifyHybrid(
        message,
        signature.classicalSignature,
        tamperedPqcSig,
        hybridKeys.classicalPublicKey,
        hybridKeys.pqcPublicKey,
      );

      expect(verification.valid).toBe(false);
      expect(verification.classicalValid).toBe(true);
      expect(verification.pqcValid).toBe(false);
    });
  });
});
