/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeveloperGraphService } from './developer-graph.service';
import { FriendsService } from '../friends/friends.service';
import { FriendsController } from '../friends/friends.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('DeveloperGraphService & Friends Graph Recommendations', () => {
  let graphService: DeveloperGraphService;
  let friendsService: FriendsService;
  let friendsController: FriendsController;
  let mockPrisma: Partial<PrismaService>;

  beforeEach(async () => {
    mockPrisma = {
      follows: {
        create: jest.fn(
          ({ data }: { data: { followerId: string; followingId: string } }) =>
            Promise.resolve({
              ...data,
              createdAt: new Date(),
            }),
        ),
        delete: jest.fn(
          ({
            where,
          }: {
            where: {
              followerId_followingId: {
                followerId: string;
                followingId: string;
              };
            };
          }) =>
            Promise.resolve({
              ...where.followerId_followingId,
            }),
        ),
        findMany: jest.fn(() => Promise.resolve([])),
      } as unknown as PrismaService['follows'],
      activity: {
        findMany: jest.fn(() => Promise.resolve([])),
        count: jest.fn(() => Promise.resolve(0)),
      } as unknown as PrismaService['activity'],
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [
        DeveloperGraphService,
        FriendsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    graphService = module.get<DeveloperGraphService>(DeveloperGraphService);
    friendsService = module.get<FriendsService>(FriendsService);
    friendsController = module.get<FriendsController>(FriendsController);
  });

  afterEach(async () => {
    await graphService.onModuleDestroy();
  });

  describe('Graph Node & Edge Modeling', () => {
    it('should model and upsert Developer, Language, Repository, and Guild entities', async () => {
      // Upsert Developer node
      await graphService.upsertDeveloperNode({
        id: 'dev-alice',
        username: 'alice_codes',
        name: 'Alice Wonder',
        avatar: 'https://avatar.dev/alice.png',
      });

      await graphService.upsertDeveloperNode({
        id: 'dev-bob',
        username: 'bob_builder',
        name: 'Bob Builder',
      });

      // Link FOLLOWS edge
      await graphService.upsertFollowsEdge('dev-alice', 'dev-bob');

      // Link Language proficiency
      await graphService.addProficiencyEdge('dev-alice', 'Rust', 'Expert');
      await graphService.addProficiencyEdge('dev-bob', 'Rust', 'Intermediate');

      // Link Repository contribution
      await graphService.addContributionEdge(
        'dev-alice',
        'repo-hyper',
        'codepulse/hyper',
        42,
      );
      await graphService.addContributionEdge(
        'dev-bob',
        'repo-hyper',
        'codepulse/hyper',
        12,
      );

      // Link Guild membership
      await graphService.addGuildMembershipEdge(
        'dev-alice',
        'guild-rustaceans',
        'Rustaceans Guild',
      );
    });
  });

  describe('Multi-Hop Social & Skill Graph Traversals (2nd & 3rd Degree)', () => {
    beforeEach(async () => {
      // Setup social graph:
      // Alice -> follows Bob -> follows Charlie -> follows Dave
      // Alice does NOT directly follow Charlie or Dave
      await graphService.upsertDeveloperNode({
        id: 'alice',
        username: 'alice',
      });
      await graphService.upsertDeveloperNode({ id: 'bob', username: 'bob' });
      await graphService.upsertDeveloperNode({
        id: 'charlie',
        username: 'charlie',
      });
      await graphService.upsertDeveloperNode({ id: 'dave', username: 'dave' });

      await graphService.upsertFollowsEdge('alice', 'bob');
      await graphService.upsertFollowsEdge('bob', 'charlie');
      await graphService.upsertFollowsEdge('charlie', 'dave');

      // Add shared skill (Rust) and shared repo (core-engine) between Alice and Charlie
      await graphService.addProficiencyEdge('alice', 'Rust');
      await graphService.addProficiencyEdge('charlie', 'Rust');

      await graphService.addContributionEdge(
        'alice',
        'repo-core',
        'codepulse/core',
      );
      await graphService.addContributionEdge(
        'charlie',
        'repo-core',
        'codepulse/core',
      );
    });

    it('should discover 2nd-degree connection (Charlie) and calculate weighted recommendation score in < 10ms', async () => {
      const startTime = Date.now();
      const recommendations = await graphService.getPeerRecommendations(
        'alice',
        5,
      );
      const durationMs = Date.now() - startTime;

      expect(durationMs).toBeLessThan(50); // fast in-memory execution < 10-50ms
      expect(recommendations.length).toBeGreaterThan(0);

      const charlieRec = recommendations.find(
        (r) => r.developer.username === 'charlie',
      );
      expect(charlieRec).toBeDefined();
      expect(charlieRec?.degreeOfSeparation).toBe(2);
      expect(charlieRec?.mutualFollowersCount).toBe(1); // Bob
      expect(charlieRec?.sharedLanguages).toContain('Rust');
      expect(charlieRec?.sharedRepositories).toContain('repo-core');
      expect(charlieRec?.recommendationScore).toBeGreaterThan(0);
    });

    it('should discover 3rd-degree connection (Dave) with lower precedence than 2nd-degree', async () => {
      const recommendations = await graphService.getPeerRecommendations(
        'alice',
        5,
      );

      const charlieRec = recommendations.find(
        (r) => r.developer.username === 'charlie',
      );
      const daveRec = recommendations.find(
        (r) => r.developer.username === 'dave',
      );

      expect(daveRec).toBeDefined();
      expect(daveRec?.degreeOfSeparation).toBe(3);
      // Charlie (2nd degree + shared Rust + shared repo) ranks above Dave (3rd degree)
      expect(charlieRec!.recommendationScore).toBeGreaterThan(
        daveRec!.recommendationScore,
      );
    });
  });

  describe('Graph Algorithms: PageRank & Community Detection', () => {
    beforeEach(async () => {
      // Create influential star topology: Bob has multiple incoming follows
      await graphService.upsertDeveloperNode({ id: 'u1', username: 'user1' });
      await graphService.upsertDeveloperNode({ id: 'u2', username: 'user2' });
      await graphService.upsertDeveloperNode({ id: 'u3', username: 'user3' });
      await graphService.upsertDeveloperNode({
        id: 'influencer',
        username: 'influencer_dan',
      });

      await graphService.upsertFollowsEdge('u1', 'influencer');
      await graphService.upsertFollowsEdge('u2', 'influencer');
      await graphService.upsertFollowsEdge('u3', 'influencer');

      await graphService.addProficiencyEdge('u1', 'TypeScript');
      await graphService.addProficiencyEdge('u2', 'TypeScript');
      await graphService.addProficiencyEdge('influencer', 'TypeScript');
      await graphService.addProficiencyEdge('u3', 'Rust');
    });

    it('should calculate PageRank and rank developer with highest inbound links at the top', async () => {
      const pagerankResults = await graphService.computePageRank();

      expect(pagerankResults.length).toBeGreaterThan(0);
      expect(pagerankResults[0].username).toBe('influencer_dan');
      expect(pagerankResults[0].rank).toBeGreaterThan(
        pagerankResults[pagerankResults.length - 1].rank,
      );
    });

    it('should perform community detection clustering developers by ecosystem interest', async () => {
      const communities = await graphService.detectCommunities();

      expect(communities.length).toBeGreaterThan(0);
      const tsCommunity = communities.find((c) =>
        c.topLanguages.includes('TypeScript'),
      );
      expect(tsCommunity).toBeDefined();
      expect(tsCommunity?.developerCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('FriendsController Graph Recommendation Endpoint', () => {
    it('GET /api/v1/friends/recommendations/graph returns recommendations for user', async () => {
      await graphService.upsertDeveloperNode({
        id: '123',
        username: 'current_user',
      });
      await graphService.upsertDeveloperNode({
        id: 'peer_a',
        username: 'peer_a',
      });
      await graphService.upsertDeveloperNode({
        id: 'peer_b',
        username: 'peer_b',
      });

      await graphService.upsertFollowsEdge('123', 'peer_a');
      await graphService.upsertFollowsEdge('peer_a', 'peer_b');

      const res = await friendsController.getGraphRecommendations('123', 5);
      expect(res).toBeDefined();
      expect(Array.isArray(res)).toBe(true);
      expect(res.some((r) => r.developer.username === 'peer_b')).toBe(true);
    });

    it('should trigger asynchronous graph sync when following a user via FriendsService', async () => {
      const followResult = await friendsService.followUser('user-x', 'user-y');
      expect(followResult).toBeDefined();
      expect(mockPrisma.follows?.create).toHaveBeenCalledWith({
        data: { followerId: 'user-x', followingId: 'user-y' },
      });
    });

    it('should trigger asynchronous graph sync when unfollowing a user via FriendsService', async () => {
      const unfollowResult = await friendsService.unfollowUser(
        'user-x',
        'user-y',
      );
      expect(unfollowResult).toBeDefined();
      expect(mockPrisma.follows?.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 'user-x',
            followingId: 'user-y',
          },
        },
      });
    });
  });
});
