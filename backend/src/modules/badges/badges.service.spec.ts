import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifiableCredentialsService } from '../identity/verifiable-credentials.service';

describe('earned badge global rarity', () => {
  const earnedAt = new Date('2026-11-01T12:00:00Z');
  const prisma = {
    userBadge: { findMany: jest.fn() },
    user: { count: jest.fn() },
  };
  const service = new BadgesService(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.count.mockResolvedValue(1000);
    prisma.userBadge.findMany.mockResolvedValue([{
      id: 'earned', userId: 'owner', earnedAt,
      badge: { id: 'badge', name: 'Pioneer', tier: 'GOLD', _count: { users: 38 } },
    }]);
  });
  it('scopes earned badges to the requested user and preserves unlock time', async () => {
    const result = await service.getUserBadges('owner');
    expect(prisma.userBadge.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' } }));
    expect(result[0].earnedAt).toEqual(earnedAt);
    expect(result[0].badge.globalUnlockPercent).toBe(3.8);
    expect(result[0].badge).not.toHaveProperty('_count');
  });
  it('does not divide by zero when the user count is unavailable as a denominator', async () => {
    prisma.user.count.mockResolvedValue(0);
    expect((await service.getUserBadges('owner'))[0].badge.globalUnlockPercent).toBeNull();
  });
  it('returns an empty collection without inventing unlocked badges', async () => {
    prisma.userBadge.findMany.mockResolvedValue([]);
    expect(await service.getUserBadges('owner')).toEqual([]);
  });
});

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
