import { Test, TestingModule } from '@nestjs/testing';
import {
  VerifiableCredentialsService,
  VerifiableCredential,
} from './verifiable-credentials.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

describe('VerifiableCredentialsService', () => {
  let service: VerifiableCredentialsService;

  const mockPrismaService = {
    userBadge: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifiableCredentialsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VerifiableCredentialsService>(
      VerifiableCredentialsService,
    );
  });

  describe('DID Document (did:web:codepulse.dev)', () => {
    it('should generate a valid W3C DID document containing the ECDSA P-256 public key', () => {
      const didDoc = service.getDidDocument();

      expect(didDoc.id).toBe('did:web:codepulse.dev');
      expect(didDoc['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(didDoc.verificationMethod.length).toBe(1);

      const vm = didDoc.verificationMethod[0];
      expect(vm.id).toBe('did:web:codepulse.dev#key-1');
      expect(vm.type).toBe('JsonWebKey2020');
      expect(vm.controller).toBe('did:web:codepulse.dev');
      expect(vm.publicKeyJwk.kty).toBe('EC');
      expect(vm.publicKeyJwk.crv).toBe('P-256');
      expect(vm.publicKeyJwk.x).toBeDefined();
      expect(vm.publicKeyJwk.y).toBeDefined();

      expect(didDoc.assertionMethod).toContain(vm.id);
      expect(didDoc.authentication).toContain(vm.id);
    });
  });

  describe('Credential Issuance & W3C Data Model 2.0', () => {
    it('should issue a cryptographically signed Verifiable Credential for an earned badge', async () => {
      const mockBadge = {
        userId: 'user-uuid-123',
        badgeId: 'badge-grandmaster',
        earnedAt: new Date('2026-11-15T12:00:00Z'),
        user: {
          id: 'user-uuid-123',
          username: 'octocat',
        },
        badge: {
          id: 'badge-grandmaster',
          name: 'Grandmaster Contributor',
          tier: 'DIAMOND',
          category: 'Competitive',
        },
      };

      mockPrismaService.userBadge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.userBadge.update.mockResolvedValue({});

      const { credential, rawJwt } = await service.issueBadgeCredential(
        'user-uuid-123',
        'badge-grandmaster',
      );

      // Verify W3C VC Model conformance
      expect(credential['@context']).toContain(
        'https://www.w3.org/ns/credentials/v2',
      );
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.type).toContain('CodePulseBadgeCredential');
      expect(credential.issuer.id).toBe('did:web:codepulse.dev');
      expect(credential.credentialSubject.username).toBe('octocat');
      expect(credential.credentialSubject.badgeName).toBe(
        'Grandmaster Contributor',
      );
      expect(credential.credentialSubject.badgeTier).toBe('DIAMOND');

      // Verify proof block
      expect(credential.proof.type).toBe('JsonWebSignature2020');
      expect(credential.proof.verificationMethod).toBe(
        'did:web:codepulse.dev#key-1',
      );
      expect(credential.proof.jws).toBeDefined();

      // Verify JWT representation
      expect(rawJwt.split('.').length).toBe(3);
    });
  });

  describe('Independent Signature & Third-Party Verification', () => {
    it('should verify a valid issued JSON-LD Verifiable Credential', async () => {
      const mockBadge = {
        userId: 'user-uuid-456',
        badgeId: 'badge-bug-bounty',
        earnedAt: new Date('2026-11-16T10:00:00Z'),
        user: { id: 'user-uuid-456', username: 'security-researcher' },
        badge: {
          id: 'badge-bug-bounty',
          name: 'Bug Bounty Hunter',
          tier: 'GOLD',
          category: 'Security',
        },
      };

      mockPrismaService.userBadge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.userBadge.update.mockResolvedValue({});

      const { credential } = await service.issueBadgeCredential(
        'user-uuid-456',
        'badge-bug-bounty',
      );

      const verification = await service.verifyCredential(credential);
      expect(verification.valid).toBe(true);
      expect(verification.issuer).toBe('did:web:codepulse.dev');
      expect(verification.credentialSubject?.badgeName).toBe('Bug Bounty Hunter');
    });

    it('should verify a valid compact JWT representation', async () => {
      const mockBadge = {
        userId: 'user-uuid-789',
        badgeId: 'badge-hackathon',
        earnedAt: new Date('2026-11-17T08:00:00Z'),
        user: { id: 'user-uuid-789', username: 'hackathon-winner' },
        badge: {
          id: 'badge-hackathon',
          name: 'Hackathon Champion',
          tier: 'LEGENDARY',
          category: 'Community',
        },
      };

      mockPrismaService.userBadge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.userBadge.update.mockResolvedValue({});

      const { rawJwt } = await service.issueBadgeCredential(
        'user-uuid-789',
        'badge-hackathon',
      );

      const verification = await service.verifyCredential(rawJwt);
      expect(verification.valid).toBe(true);
      expect(verification.issuer).toBe('did:web:codepulse.dev');
      expect(verification.credentialSubject?.username).toBe('hackathon-winner');
    });

    it('should reject tampered credential fields where subject or tier has been modified', async () => {
      const mockBadge = {
        userId: 'user-uuid-tamper',
        badgeId: 'badge-bronze',
        earnedAt: new Date('2026-11-18T00:00:00Z'),
        user: { id: 'user-uuid-tamper', username: 'attacker' },
        badge: {
          id: 'badge-bronze',
          name: 'Bronze Helper',
          tier: 'BRONZE',
          category: 'General',
        },
      };

      mockPrismaService.userBadge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.userBadge.update.mockResolvedValue({});

      const { credential } = await service.issueBadgeCredential(
        'user-uuid-tamper',
        'badge-bronze',
      );

      // Maliciously tamper with the badge tier
      const tamperedCredential: VerifiableCredential = {
        ...credential,
        credentialSubject: {
          ...credential.credentialSubject,
          badgeTier: 'GRANDMASTER', // forged tier
        },
      };

      const verification = await service.verifyCredential(tamperedCredential);
      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/Cryptographic signature mismatch|tamper/i);
    });

    it('should reject tampered compact JWT string', async () => {
      const mockBadge = {
        userId: 'user-uuid-jwt-tamper',
        badgeId: 'badge-jwt',
        earnedAt: new Date('2026-11-18T01:00:00Z'),
        user: { id: 'user-uuid-jwt-tamper', username: 'attacker2' },
        badge: {
          id: 'badge-jwt',
          name: 'First Commit',
          tier: 'BRONZE',
          category: 'General',
        },
      };

      mockPrismaService.userBadge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.userBadge.update.mockResolvedValue({});

      const { rawJwt } = await service.issueBadgeCredential(
        'user-uuid-jwt-tamper',
        'badge-jwt',
      );

      const [header, payload, sig] = rawJwt.split('.');
      const decodedPayload = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      );
      decodedPayload.vc.credentialSubject.badgeName = 'Forged Supreme Badge';
      const tamperedPayload = Buffer.from(
        JSON.stringify(decodedPayload),
      ).toString('base64url');

      const tamperedJwt = `${header}.${tamperedPayload}.${sig}`;

      const verification = await service.verifyCredential(tamperedJwt);
      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/Invalid JWT signature|Tampering/i);
    });
  });
});

