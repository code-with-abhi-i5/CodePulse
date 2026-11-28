import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { GitTreeService } from './git-tree.service';
import { QualityScorecardService } from './quality-scorecard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Repositories Deep Sync & Git Tree Scorecard (#6799)', () => {
  let repositoriesService: RepositoriesService;
  let gitTreeService: GitTreeService;
  let qualityScorecardService: QualityScorecardService;

  const mockPrismaService = {
    repository: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    repositoryQualityScorecard: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoriesService,
        GitTreeService,
        QualityScorecardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repositoriesService = module.get<RepositoriesService>(RepositoriesService);
    gitTreeService = module.get<GitTreeService>(GitTreeService);
    qualityScorecardService = module.get<QualityScorecardService>(QualityScorecardService);
  });

  describe('GitTreeService', () => {
    it('should throw BadRequestException when path traversal is attempted', async () => {
      await expect(
        gitTreeService.getRepositoryTree('owner/repo', 'main', '../secrets'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return fallback tree when external API fails or is unconfigured', async () => {
      const result = await gitTreeService.getRepositoryTree('owner/test-repo', 'main', undefined, 3);
      expect(result.sha).toBe('main');
      expect(result.tree.length).toBeGreaterThan(0);
      expect(result.tree.some((n) => n.path === 'README.md')).toBe(true);
      expect(result.tree.some((n) => n.path === 'LICENSE')).toBe(true);
    });

    it('should filter tree nodes by depth correctly', async () => {
      const result = await gitTreeService.getRepositoryTree('owner/test-repo', 'main', undefined, 1);
      // All paths at depth 1 should have no slashes
      const hasDeepSlash = result.tree.some((n) => n.path.includes('/'));
      expect(hasDeepSlash).toBe(false);
    });
  });

  describe('QualityScorecardService', () => {
    it('should compute an A+ grade for a complete repo with tests, CI, and docs', async () => {
      const mockNodes = [
        { path: 'README.md', mode: '100644', type: 'blob' as const, sha: '1', size: 1500 },
        { path: 'LICENSE', mode: '100644', type: 'blob' as const, sha: '2' },
        { path: 'CONTRIBUTING.md', mode: '100644', type: 'blob' as const, sha: '3' },
        { path: 'jest.config.ts', mode: '100644', type: 'blob' as const, sha: '4' },
        { path: 'src/app.spec.ts', mode: '100644', type: 'blob' as const, sha: '5' },
        { path: 'src/service.spec.ts', mode: '100644', type: 'blob' as const, sha: '6' },
        { path: '.github/workflows/ci.yml', mode: '100644', type: 'blob' as const, sha: '7' },
      ];

      mockPrismaService.repositoryQualityScorecard.upsert.mockImplementation(({ create }) =>
        Promise.resolve(create),
      );

      const scorecard = await qualityScorecardService.evaluateRepositoryQuality(
        'repo-123',
        mockNodes,
        250, // high commits
        5,   // low issues
      );

      expect(scorecard.hasLicense).toBe(true);
      expect(scorecard.hasCi).toBe(true);
      expect(scorecard.testFramework).toBe('Jest');
      expect(scorecard.overallScore).toBeGreaterThanOrEqual(85);
      expect(['A', 'A+']).toContain(scorecard.grade);
    });

    it('should assign lower grades (C or D) for repos missing tests and CI/CD', async () => {
      const sparseNodes = [
        { path: 'README.md', mode: '100644', type: 'blob' as const, sha: '1', size: 100 },
        { path: 'index.js', mode: '100644', type: 'blob' as const, sha: '2' },
      ];

      mockPrismaService.repositoryQualityScorecard.upsert.mockImplementation(({ create }) =>
        Promise.resolve(create),
      );

      const scorecard = await qualityScorecardService.evaluateRepositoryQuality(
        'repo-sparse',
        sparseNodes,
        5,
        10,
      );

      expect(scorecard.hasLicense).toBe(false);
      expect(scorecard.hasCi).toBe(false);
      expect(scorecard.testingScore).toBe(0);
      expect(['C', 'D', 'F']).toContain(scorecard.grade);
    });
  });

  describe('RepositoriesService Deep Sync', () => {
    it('should perform deep sync and return fresh scorecard', async () => {
      mockPrismaService.repository.findFirst.mockResolvedValue({
        id: 'repo-abc',
        userId: 'usr-1',
        name: 'sample-project',
        fullName: 'alice/sample-project',
        commits: 150,
        issues: 4,
      });

      mockPrismaService.repository.update.mockResolvedValue({
        id: 'repo-abc',
        name: 'sample-project',
        updatedAt: new Date(),
        repoUpdatedAt: new Date(),
      });

      mockPrismaService.repositoryQualityScorecard.upsert.mockImplementation(({ create }) =>
        Promise.resolve(create),
      );

      const result = await repositoriesService.syncRepository('usr-1', 'repo-abc');

      expect(result.success).toBe(true);
      expect(result.repository).toBeDefined();
      expect(result.scorecard).toBeDefined();
      expect(result.scorecard.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should enforce private repository access permissions in tree inspection', async () => {
      mockPrismaService.repository.findUnique.mockResolvedValue({
        id: 'private-repo',
        userId: 'owner-other',
        isPrivate: true,
      });

      await expect(
        repositoriesService.getRepositoryTree('intruder-user', 'private-repo'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
