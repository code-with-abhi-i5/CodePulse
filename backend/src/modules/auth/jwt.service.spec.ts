import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PostQuantumJwtService } from './jwt.service';
import { PostQuantumService } from '../crypto/post-quantum.service';

describe('PostQuantumJwtService (#548 Quantum-Resistant Tokens)', () => {
  let jwtService: PostQuantumJwtService;
  let pqcService: PostQuantumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostQuantumJwtService, PostQuantumService],
    }).compile();

    jwtService = module.get<PostQuantumJwtService>(PostQuantumJwtService);
    pqcService = module.get<PostQuantumService>(PostQuantumService);
  });

  describe('ML-DSA-65 Token Signing & Verification', () => {
    it('signs and verifies a quantum-resistant JWT token', () => {
      const dsaKeys = pqcService.generateDsaKeyPair();
      const payload = { sub: 'usr-45678', username: 'alice_crypto', role: 'GRANDMASTER' };

      const token = jwtService.signToken(payload, {
        pqcSecretKey: dsaKeys.secretKey,
        expiresInSeconds: 3600,
      });

      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3); // header.payload.pqcSig

      const verified = jwtService.verifyToken(token, {
        pqcPublicKey: dsaKeys.publicKey,
      });

      expect(verified.sub).toBe('usr-45678');
      expect(verified.username).toBe('alice_crypto');
      expect(verified.role).toBe('GRANDMASTER');
      expect(verified.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('rejects an expired token with UnauthorizedException', () => {
      const dsaKeys = pqcService.generateDsaKeyPair();
      const payload = { sub: 'usr-expired', exp: Math.floor(Date.now() / 1000) - 100 };

      const token = jwtService.signToken(payload, {
        pqcSecretKey: dsaKeys.secretKey,
      });

      expect(() => {
        jwtService.verifyToken(token, { pqcPublicKey: dsaKeys.publicKey });
      }).toThrow(UnauthorizedException);
    });

    it('rejects a tampered token payload with UnauthorizedException', () => {
      const dsaKeys = pqcService.generateDsaKeyPair();
      const payload = { sub: 'usr-victim', role: 'MEMBER' };

      const token = jwtService.signToken(payload, {
        pqcSecretKey: dsaKeys.secretKey,
      });

      const parts = token.split('.');
      // Attacker tampers payload to elevate role to ADMIN
      const forgedPayload = Buffer.from(
        JSON.stringify({ sub: 'usr-victim', role: 'ADMIN', exp: 9999999999 }),
      ).toString('base64url');
      const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

      expect(() => {
        jwtService.verifyToken(forgedToken, { pqcPublicKey: dsaKeys.publicKey });
      }).toThrow(UnauthorizedException);
    });
  });

  describe('Hybrid Dual-Signature Token Signing & Verification', () => {
    it('signs and verifies hybrid tokens with 0% false rejections', () => {
      const hybridKeys = pqcService.generateHybridKeyPair();
      const payload = { sub: 'usr-hybrid-leader', tournamentId: 'nsoc-2026-finals' };

      const token = jwtService.signToken(payload, {
        pqcSecretKey: hybridKeys.pqcSecretKey,
        classicalSecretKey: hybridKeys.classicalSecretKey,
        expiresInSeconds: 7200,
      });

      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(4); // header.payload.classicalSig.pqcSig

      const verified = jwtService.verifyToken(token, {
        pqcPublicKey: hybridKeys.pqcPublicKey,
        classicalPublicKey: hybridKeys.classicalPublicKey,
      });

      expect(verified.sub).toBe('usr-hybrid-leader');
      expect(verified.tournamentId).toBe('nsoc-2026-finals');
    });

    it('rejects hybrid token if classical or PQC key is mismatched', () => {
      const hybridKeys = pqcService.generateHybridKeyPair();
      const attackerKeys = pqcService.generateHybridKeyPair();
      const payload = { sub: 'usr-test' };

      const token = jwtService.signToken(payload, {
        pqcSecretKey: hybridKeys.pqcSecretKey,
        classicalSecretKey: hybridKeys.classicalSecretKey,
      });

      expect(() => {
        jwtService.verifyToken(token, {
          pqcPublicKey: attackerKeys.pqcPublicKey, // wrong PQC key
          classicalPublicKey: hybridKeys.classicalPublicKey,
        });
      }).toThrow(UnauthorizedException);
    });
  });
});
