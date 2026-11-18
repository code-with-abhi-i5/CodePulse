import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import {
  parsePrMetric,
  summarizePrMetrics,
  type PullSnapshot,
  type ReviewSnapshot,
} from './pr-metrics';

@Injectable()
export class PrAnalyticsService {
  private readonly logger = new Logger(PrAnalyticsService.name);
  private readonly inflight = new Map<
    string,
    Promise<{ refreshed: number; partial: boolean }>
  >();
  private running = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async report(userId: string, now = new Date()) {
    const since = new Date(now.getTime() - 30 * 86400000);
    const rows = await this.prisma.pullRequestMetric.findMany({
      where: {
        repository: { userId, isPrivate: false, archivedAt: null },
        createdAt: { gte: since, lte: now },
      },
      take: 1001,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const result = summarizePrMetrics(rows.slice(0, 1000));
    return {
      ...result,
      partial: result.partial || rows.length > 1000,
      cohortStart: since.toISOString(),
      cohortEnd: now.toISOString(),
      methodology:
        'Snapshot sample of public repository PRs created in the past 30 days; medians exclude absent events. Reviewer load counts distinct PR/reviewer pairs, excluding self and pending reviews. Efficiency score is a product heuristic. Sampling bounds are not complete team coverage. JSON is exportable.',
    };
  }

  async refresh(userId: string, id: string) {
    const repo = await this.prisma.repository.findFirst({
      where: { id, userId },
    });
    if (!repo) throw new NotFoundException('Repository not found');
    if (repo.isPrivate || repo.archivedAt)
      throw new UnprocessableEntityException(
        'Only active public repositories are supported',
      );
    return this.refreshRepository(repo.id, repo.fullName);
  }

  private async refreshRepository(repositoryId: string, fullName: string) {
    const parts = fullName.split('/');
    if (
      parts.length !== 2 ||
      parts.some((p) => !/^[\w.-]+$/.test(p) || p === '.' || p === '..')
    )
      throw new BadRequestException('Invalid repository');
    const existing = this.inflight.get(repositoryId);
    if (existing) return existing;
    const task = this.collect(repositoryId, parts).finally(() =>
      this.inflight.delete(repositoryId),
    );
    this.inflight.set(repositoryId, task);
    return task;
  }
  private async collect(repositoryId: string, parts: string[]) {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const options = {
      timeout: 10000,
      maxContentLength: 4 * 1024 * 1024,
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CodePulse-Developer-Platform',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const base = `https://api.github.com/repos/${parts.map(encodeURIComponent).join('/')}/pulls`;
    try {
      const response = await axios.get<{ number: number }[]>(base, {
        ...options,
        params: {
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 10,
        },
      });
      if (!Array.isArray(response.data)) throw new Error('Invalid PR list');
      let partial =
        response.data.length >= 10 ||
        Boolean(response.headers?.link?.includes('rel="next"'));
      const records: ReturnType<typeof parsePrMetric>[] = [];
      const seen = new Set<number>();
      for (const pr of response.data.slice(0, 10)) {
        if (!Number.isInteger(pr.number) || pr.number < 1)
          throw new Error('Invalid PR id');
        if (seen.has(pr.number)) continue;
        seen.add(pr.number);
        const detail = await axios.get<PullSnapshot>(
          `${base}/${pr.number}`,
          options,
        );
        if (detail.data.number !== pr.number) throw new Error('Mismatched PR');
        const reviews = await axios.get<ReviewSnapshot[]>(
          `${base}/${pr.number}/reviews`,
          { ...options, params: { per_page: 100 } },
        );
        if (!Array.isArray(reviews.data)) throw new Error('Invalid reviews');
        const truncated =
          reviews.data.length >= 100 ||
          Boolean(reviews.headers?.link?.includes('rel="next"'));
        partial ||= truncated;
        records.push(
          parsePrMetric(
            detail.data,
            reviews.data.slice(0, 100),
            partial || truncated,
          ),
        );
      }
      // One transaction publishes the refresh; replaying a snapshot updates the same composite key.
      await this.prisma.$transaction(
        records.map((data) =>
          this.prisma.pullRequestMetric.upsert({
            where: {
              repositoryId_prNumber: { repositoryId, prNumber: data.prNumber },
            },
            create: { repositoryId, ...data, partial: partial || data.partial },
            update: { ...data, partial: partial || data.partial },
          }),
        ),
      );
      return { refreshed: records.length, partial };
    } catch {
      throw new BadGatewayException(
        'Could not refresh PR evidence; existing snapshots remain available',
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshNightly() {
    if (this.running) return;
    this.running = true;
    try {
      const repos = await this.prisma.repository.findMany({
        where: {
          isPrivate: false,
          archivedAt: null,
          user: { deletedAt: null },
        },
        take: 10,
        orderBy: [{ repoUpdatedAt: 'desc' }, { id: 'asc' }],
        select: { id: true, fullName: true },
      });
      for (const repo of repos) {
        try {
          await this.refreshRepository(repo.id, repo.fullName);
        } catch {
          this.logger.warn(
            'PR snapshot refresh failed; retaining previous evidence.',
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
