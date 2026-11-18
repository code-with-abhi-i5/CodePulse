import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifiableCredentialsService } from '../identity/verifiable-credentials.service';

describe('BadgesService with Verifiable Credentials', () => {
  let service: BadgesService;

  const mockPrismaService = {
    badge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockVcService = {
    issueBadgeCredential: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VerifiableCredentialsService,
          useValue: mockVcService,
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  it('should award badge and trigger W3C Verifiable Credential issuance', async () => {
    mockPrismaService.badge.findUnique.mockResolvedValue({
      id: 'badge-1',
      name: 'Grandmaster',
    });
    mockPrismaService.userBadge.upsert.mockResolvedValue({
      id: 'ub-1',
      userId: 'user-1',
      badgeId: 'badge-1',
    });
    mockVcService.issueBadgeCredential.mockResolvedValue({
      credential: { id: 'urn:uuid:test' },
      rawJwt: 'header.payload.sig',
    });

    const res = await service.awardBadge('user-1', 'badge-1');
    expect(res).toBeDefined();
    expect(mockPrismaService.userBadge.upsert).toHaveBeenCalled();
    expect(mockVcService.issueBadgeCredential).toHaveBeenCalledWith(
      'user-1',
      'badge-1',
    );
  });

  it('should export verifiable credential for an earned badge', async () => {
    mockVcService.issueBadgeCredential.mockResolvedValue({
      credential: { id: 'urn:uuid:exported-vc' },
      rawJwt: 'jwt.token.string',
    });

    const res = await service.exportBadgeCredential('user-1', 'badge-1');
    expect(res.rawJwt).toBe('jwt.token.string');
    expect(mockVcService.issueBadgeCredential).toHaveBeenCalledWith(
      'user-1',
      'badge-1',
    );
  });
});

