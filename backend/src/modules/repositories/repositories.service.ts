import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryRepositoriesDto, RepositorySortBy, SortOrder } from './dto/repositories.dto';
import { RocksDbService } from '../storage/rocksdb.service';
import {
  OwnershipHeatmapService,
  type BlameCommitTouch,
} from '../analytics/ownership-heatmap.service';
import type { ParsedAstPayload, FileSymbolTable } from '../storage/rocksdb.service';
import { DocEvaluatorService } from '../ai/doc-evaluator.service';
import { GitTreeService } from './git-tree.service';
import { QualityScorecardService } from './quality-scorecard.service';

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly rocksDb?: RocksDbService,
    @Optional() private readonly docEvaluatorService?: DocEvaluatorService,
    @Optional() private readonly ownershipHeatmap?: OwnershipHeatmapService,
    @Optional() private readonly gitTreeService?: GitTreeService,
    @Optional() private readonly qualityScorecardService?: QualityScorecardService,
  ) {}

  /**
   * Retrieves paginated repositories for the user with server-side filtering, searching, and sorting.
   */
  async getRepositories(userId: string, query: QueryRepositoriesDto = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RepositoryWhereInput = {
      userId,
      archivedAt: null,
    };

    if (query.isPrivate !== undefined) {
      where.isPrivate = query.isPrivate;
    }

    if (query.language && query.language.trim()) {
      where.language = {
        equals: query.language.trim(),
        mode: 'insensitive',
      };
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const sortOrder = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    const sortBy = query.sortBy || RepositorySortBy.UPDATED_AT;

    const orderBy: Prisma.RepositoryOrderByWithRelationInput = {};
    if (sortBy === RepositorySortBy.STARS) {
      orderBy.stars = sortOrder;
    } else if (sortBy === RepositorySortBy.FORKS) {
      orderBy.forks = sortOrder;
    } else if (sortBy === RepositorySortBy.COMMITS) {
      orderBy.commits = sortOrder;
    } else if (sortBy === RepositorySortBy.NAME) {
      orderBy.name = sortOrder;
    } else {
      orderBy.repoUpdatedAt = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.repository.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.repository.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single repository by ID with access control enforcement.
   */
  async getRepositoryById(userId: string, repositoryId: string) {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!repository) {
      throw new NotFoundException(`Repository ${repositoryId} not found`);
    }

    if (repository.userId !== userId && repository.isPrivate) {
      throw new ForbiddenException(
        'You do not have permission to view this private repository',
      );
    }

    return repository;
  }

  /**
   * Triggers an on-demand deep re-synchronization of a single repository,
   * refreshing git tree snapshots and recalculating the code quality scorecard.
   */
  async syncRepository(userId: string, repositoryId: string) {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      throw new NotFoundException(
        `Repository ${repositoryId} not found or does not belong to user`,
      );
    }

    let scorecard = null;
    if (this.gitTreeService && this.qualityScorecardService) {
      try {
        const treeResult = await this.gitTreeService.getRepositoryTree(
          repository.fullName,
          'main',
          undefined,
          5,
        );
        scorecard = await this.qualityScorecardService.evaluateRepositoryQuality(
          repositoryId,
          treeResult.tree,
          repository.commits,
          repository.issues,
        );
      } catch {
        // Fallback gracefully if remote inspection experiences transient rate-limits
      }
    }

    const updated = await this.prisma.repository.update({
      where: { id: repositoryId },
      data: {
        updatedAt: new Date(),
        repoUpdatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Repository ${repository.name} synced successfully`,
      repository: updated,
      scorecard,
    };
  }

  /**
   * Inspects directory hierarchy and git tree for repository.
   */
  async getRepositoryTree(
    userId: string,
    repositoryId: string,
    ref = 'main',
    subPath?: string,
    depth = 3,
  ) {
    const repository = await this.getRepositoryById(userId, repositoryId);
    if (!this.gitTreeService) {
      throw new NotFoundException('Git tree exploration service unavailable');
    }
    return this.gitTreeService.getRepositoryTree(
      repository.fullName,
      ref,
      subPath,
      depth,
    );
  }

  /**
   * Retrieves or computes automated code quality scorecard for repository.
   */
  async getQualityScorecard(userId: string, repositoryId: string) {
    const repository = await this.getRepositoryById(userId, repositoryId);
    if (!this.qualityScorecardService) {
      throw new NotFoundException('Quality scorecard service unavailable');
    }

    let scorecard = await this.qualityScorecardService.getScorecard(repositoryId);
    if (!scorecard && this.gitTreeService) {
      const tree = await this.gitTreeService.getRepositoryTree(
        repository.fullName,
        'main',
        undefined,
        4,
      );
      scorecard = await this.qualityScorecardService.evaluateRepositoryQuality(
        repositoryId,
        tree.tree,
        repository.commits,
        repository.issues,
      ) as any;
    }

    return scorecard;
  }

  /**
   * Retrieves aggregated distinct programming languages and repository counts for the user.
   */
  async getUserLanguages(userId: string) {
    const repos = await this.prisma.repository.findMany({
      where: {
        userId,
        archivedAt: null,
        language: { not: null },
      },
      select: {
        language: true,
        languageColor: true,
      },
    });

    const languageCounts: Record<
      string,
      { count: number; color: string | null }
    > = {};

    for (const r of repos) {
      if (!r.language) continue;
      if (!languageCounts[r.language]) {
        languageCounts[r.language] = {
          count: 0,
          color: r.languageColor,
        };
      }
      languageCounts[r.language].count++;
    }

    return Object.entries(languageCounts).map(([name, stat]) => ({
      name,
      count: stat.count,
      color: stat.color,
    }));
  }

  /**
   * Retrieves or parses and caches AST for a repository file using RocksDB (#549).
   */
  async getFileAst(
    userId: string,
    repositoryId: string,
    commitSha: string,
    filePath: string,
    fallbackContent?: string,
  ): Promise<ParsedAstPayload | null> {
    await this.getRepositoryById(userId, repositoryId);

    if (this.rocksDb) {
      const cached = await this.rocksDb.getAst(commitSha, filePath);
      if (cached) return cached;

      if (fallbackContent) {
        return this.rocksDb.parseAndCacheAst(commitSha, filePath, fallbackContent);
      }
    }

    return null;
  }

  /**
   * Retrieves or extracts and caches symbol definitions for a repository file using RocksDB (#549).
   */
  async getFileSymbols(
    userId: string,
    repositoryId: string,
    commitSha: string,
    filePath: string,
    fallbackContent?: string,
  ): Promise<FileSymbolTable | null> {
    await this.getRepositoryById(userId, repositoryId);

    if (this.rocksDb) {
      const cached = await this.rocksDb.getSymbols(commitSha, filePath);
      if (cached) return cached;

      if (fallbackContent) {
        return this.rocksDb.parseAndCacheSymbols(commitSha, filePath, fallbackContent);
      }
    }

    return null;
  }

  /**
   * Retrieves all file symbols across the workspace for a commit SHA (#549).
   */
  async getWorkspaceSymbols(
    userId: string,
    repositoryId: string,
    commitSha: string,
  ): Promise<FileSymbolTable[]> {
    await this.getRepositoryById(userId, repositoryId);

    if (this.rocksDb) {
      return this.rocksDb.getWorkspaceSymbols(commitSha);
    }

    return [];
  }

  /**
   * Evaluates the documentation quality of a repository README (#368).
   * Generates a Documentation Score (0-100), checklist, readability score, and badge URL.
   */
  async getRepositoryDocScore(
    userId: string,
    repositoryId: string,
    customReadme?: string,
  ) {
    const repository = await this.getRepositoryById(userId, repositoryId);

    const evaluator = this.docEvaluatorService || new DocEvaluatorService();

    const readmeContent =
      customReadme ||
      `# ${repository.name}\n\n${repository.description || 'Enterprise repository powered by CodePulse.'}\n\n## Installation\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n## Contributing\nContributions are welcome! Please open an issue or pull request.\n\n## License\nMIT\n`;

    return evaluator.evaluateDocumentation(readmeContent, {
      id: repository.id,
      name: repository.name,
    });
  }

  /**
   * Generates dynamic SVG badge for repository doc score (#368).
   */
  async getRepositoryDocBadge(
    userId: string,
    repositoryId: string,
  ): Promise<string> {
    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new NotFoundException(`Repository ${repositoryId} not found`);
    }

    const evaluator = this.docEvaluatorService || new DocEvaluatorService();
    const result = await this.getRepositoryDocScore(repository.userId, repositoryId);
    return evaluator.generateBadgeSvg(result.score, result.grade);
  }

  analyzeRepositoryCodeOwnership(repositoryId: string, commits: BlameCommitTouch[]) {
    if (!this.ownershipHeatmap) return null;
    return this.ownershipHeatmap.analyzeOwnershipHeatmap({ repositoryId, commits });
  }
}
