import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RepositorySortBy, SortOrder } from './dto/repositories.dto';

describe('RepositoriesService (#501)', () => {
  let service: RepositoriesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      repository: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new RepositoriesService(prisma as unknown as PrismaService);
  });

  describe('getRepositories server-side query engine', () => {
    it('returns paginated repositories with totalPages calculation', async () => {
      const mockRepos = [
        { id: 'r1', name: 'repo-one', stars: 10, language: 'TypeScript' },
        { id: 'r2', name: 'repo-two', stars: 5, language: 'Rust' },
      ];
      prisma.repository.findMany.mockResolvedValueOnce(mockRepos);
      prisma.repository.count.mockResolvedValueOnce(15);

      const result = await service.getRepositories('user-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
      expect(prisma.repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', archivedAt: null }),
          skip: 0,
          take: 10,
        }),
      );
    });

    it('filters by language, privacy status, and search query', async () => {
      prisma.repository.findMany.mockResolvedValueOnce([]);
      prisma.repository.count.mockResolvedValueOnce(0);

      await service.getRepositories('user-1', {
        language: 'TypeScript',
        isPrivate: false,
        search: 'pulse',
        sortBy: RepositorySortBy.STARS,
        sortOrder: SortOrder.DESC,
      });

      expect(prisma.repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            isPrivate: false,
            language: { equals: 'TypeScript', mode: 'insensitive' },
            OR: [
              { name: { contains: 'pulse', mode: 'insensitive' } },
              { description: { contains: 'pulse', mode: 'insensitive' } },
            ],
          }),
          orderBy: { stars: 'desc' },
        }),
      );
    });

    it('supports sorting by forks, commits, and name', async () => {
      prisma.repository.findMany.mockResolvedValue([]);
      prisma.repository.count.mockResolvedValue(0);

      await service.getRepositories('user-1', {
        sortBy: RepositorySortBy.FORKS,
        sortOrder: SortOrder.ASC,
      });
      expect(prisma.repository.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { forks: 'asc' } }),
      );

      await service.getRepositories('user-1', {
        sortBy: RepositorySortBy.COMMITS,
        sortOrder: SortOrder.DESC,
      });
      expect(prisma.repository.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { commits: 'desc' } }),
      );

      await service.getRepositories('user-1', {
        sortBy: RepositorySortBy.NAME,
        sortOrder: SortOrder.ASC,
      });
      expect(prisma.repository.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  describe('getRepositoryById access control', () => {
    it('returns repository details for the owner', async () => {
      const mockRepo = {
        id: 'r1',
        name: 'my-repo',
        userId: 'user-1',
        isPrivate: true,
      };
      prisma.repository.findUnique.mockResolvedValueOnce(mockRepo);

      const res = await service.getRepositoryById('user-1', 'r1');

      expect(res.id).toBe('r1');
    });

    it('allows viewing a public repository owned by another user', async () => {
      const mockRepo = {
        id: 'r1',
        name: 'public-repo',
        userId: 'user-2',
        isPrivate: false,
      };
      prisma.repository.findUnique.mockResolvedValueOnce(mockRepo);

      const res = await service.getRepositoryById('user-1', 'r1');

      expect(res.id).toBe('r1');
    });

    it('throws ForbiddenException when viewing private repository of another user', async () => {
      const mockRepo = {
        id: 'r1',
        name: 'secret-repo',
        userId: 'user-2',
        isPrivate: true,
      };
      prisma.repository.findUnique.mockResolvedValueOnce(mockRepo);

      await expect(
        service.getRepositoryById('user-1', 'r1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when repository does not exist', async () => {
      prisma.repository.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getRepositoryById('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncRepository on-demand synchronization', () => {
    it('throws NotFoundException if repository does not belong to caller', async () => {
      prisma.repository.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.syncRepository('user-1', 'r-other'),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates repository timestamps and confirms synchronization', async () => {
      const existing = { id: 'r1', name: 'my-project', userId: 'user-1' };
      prisma.repository.findFirst.mockResolvedValueOnce(existing);
      prisma.repository.update.mockResolvedValueOnce({
        ...existing,
        updatedAt: new Date(),
      });

      const res = await service.syncRepository('user-1', 'r1');

      expect(res.success).toBe(true);
      expect(res.message).toContain('synced successfully');
      expect(prisma.repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' } }),
      );
    });
  });

  describe('getUserLanguages', () => {
    it('aggregates distinct languages and counts from user repositories', async () => {
      prisma.repository.findMany.mockResolvedValueOnce([
        { language: 'TypeScript', languageColor: '#3178c6' },
        { language: 'TypeScript', languageColor: '#3178c6' },
        { language: 'Python', languageColor: '#3572A5' },
      ]);

      const result = await service.getUserLanguages('user-1');

      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'TypeScript', count: 2, color: '#3178c6' },
          { name: 'Python', count: 1, color: '#3572A5' },
        ]),
      );
    });
  });
});
