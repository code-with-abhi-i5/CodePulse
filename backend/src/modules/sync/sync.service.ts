import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
  ) {}

  async syncUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return;
    }
    const token = (user as any).githubAccessToken || process.env.GITHUB_TOKEN || '';
    return this.syncUserData(user.id, user.username, token);
  }

  async syncUserData(userId: string, username: string, accessToken: string) {
    this.logger.log(`Starting GitHub sync for ${username}`);
    const githubData = await this.github.fetchUserData(username, accessToken);

    if (!githubData) {
      this.logger.warn(`Failed to sync data for ${username}`);
      return;
    }

    // Finish remote reads before opening a transaction or touching stored data.
    const githubEvents = await this.github.fetchUserEvents(
      username,
      accessToken,
      100,
      true,
      true,
    );
    if (
      !Array.isArray(githubEvents) ||
      !Array.isArray(githubData.repositories?.nodes)
    ) {
      throw new Error('Incomplete GitHub sync response');
    }
    // GitHub's current Events API exposes before/head for pushes but omits
    // commit messages. Enrich recent pushes before opening the DB transaction.
    const pushMessages = new Map<number, string[]>();
    const recentPushIndices = githubEvents
      .map((event: any, index: number) => ({ event, index }))
      .filter(({ event }: { event: any }) =>
        event.type === 'PushEvent' &&
        Date.now() - new Date(event.created_at).getTime() < 3 * 24 * 60 * 60 * 1000,
      )
      .slice(0, 30);
    for (let offset = 0; offset < recentPushIndices.length; offset += 4) {
      await Promise.all(recentPushIndices.slice(offset, offset + 4).map(async ({ event, index }: { event: any; index: number }) => {
        const supplied = Array.isArray(event.payload?.commits)
          ? event.payload.commits.map((commit: { message?: unknown }) => commit.message)
              .filter((message: unknown): message is string => typeof message === 'string' && message.trim().length > 0)
          : [];
        const messages = supplied.length > 0 ? supplied : await this.github.fetchPushCommitMessages(
          event.repo?.name,
          event.payload?.before,
          event.payload?.head,
          accessToken,
        );
        pushMessages.set(index, messages);
      }));
    }
    try {
      await this.prisma.$transaction(
        async (tx) => {
          // Serialize syncs for this user, including legacy-event adoption.
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
          // 1. Process Stats
          const totalCommits =
            githubData.contributionsCollection?.totalCommitContributions || 0;
          const totalPRs =
            githubData.contributionsCollection?.totalPullRequestContributions ||
            0;
          const totalIssues =
            githubData.contributionsCollection?.totalIssueContributions || 0;
          const repos = githubData.repositories?.nodes || [];
          const followers = githubData.followers?.totalCount || 0;
          const following = githubData.following?.totalCount || 0;

          let totalStars = 0;
          let totalForks = 0;
          const languageMap = new Map<
            string,
            { count: number; color: string }
          >();

          for (const repo of repos) {
            totalStars += repo.stargazerCount || 0;
            totalForks += repo.forkCount || 0;
            if (repo.primaryLanguage) {
              const lang = repo.primaryLanguage;
              const current = languageMap.get(lang.name) || {
                count: 0,
                color: lang.color,
              };
              current.count += 1;
              languageMap.set(lang.name, current);
            }
          }

          // Calculate streak
          const days =
            githubData.contributionsCollection?.contributionCalendar?.weeks?.flatMap(
              (w: any) => w.contributionDays,
            ) || [];
          let currentStreak = 0;
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].contributionCount > 0) {
              currentStreak++;
            } else if (i < days.length - 1) {
              // If it's not today and count is 0, streak broken
              break;
            }
          }

          // Parse contributionCalendar for Heatmap and Line Chart
          const weeks =
            githubData.contributionsCollection?.contributionCalendar?.weeks ||
            [];
          const heatmapData = [];
          const commitActivityData = [];

          for (const week of weeks) {
            for (const day of week.contributionDays) {
              heatmapData.push({
                date: day.date,
                count: day.contributionCount,
              });

              if (day.contributionCount > 0) {
                commitActivityData.push({
                  date: day.date,
                  commits: day.contributionCount,
                });
              }
            }
          }

          await tx.developerStats.upsert({
            where: { userId },
            update: {
              totalCommits,
              totalPRs,
              totalIssues,
              totalStars,
              totalForks,
              totalRepos: repos.length,
              followers,
              following,
              streak: currentStreak,
              contributionData: heatmapData,
              commitActivity: commitActivityData,
            },
            create: {
              userId,
              totalCommits,
              totalPRs,
              totalIssues,
              totalStars,
              totalForks,
              totalRepos: repos.length,
              followers,
              following,
              streak: currentStreak,
              contributionData: heatmapData,
              commitActivity: commitActivityData,
            },
          });

          // Update user with social links
          const socialLinks =
            githubData.socialAccounts?.nodes?.map((node: any) => ({
              provider: node.provider,
              url: node.url,
            })) || [];

          if (socialLinks.length > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { socialLinks },
            });
          }

          // 2. Process Languages
          const totalLangCount = Array.from(languageMap.values()).reduce(
            (sum, val) => sum + val.count,
            0,
          );
          for (const [name, data] of languageMap.entries()) {
            const percentage =
              totalLangCount > 0 ? (data.count / totalLangCount) * 100 : 0;
            await tx.languageStat.upsert({
              where: { userId_name: { userId, name } },
              update: {
                color: data.color,
                percentage: parseFloat(percentage.toFixed(1)),
                repos: data.count,
                linesOfCode: data.count * 1250, // rough estimate for dashboard visual
              },
              create: {
                userId,
                name,
                color: data.color,
                percentage: parseFloat(percentage.toFixed(1)),
                repos: data.count,
                linesOfCode: data.count * 1250,
              },
            });
          }

          // 3. Process Rating & XP
          // Read existing rating to preserve gamification XP (battles, challenges, etc.)
          const currentRating = await tx.developerRating.findUnique({
            where: { userId },
            select: { gamificationXp: true, overall: true },
          });
          const gamificationXp = currentRating?.gamificationXp ?? 0;

          // Base GitHub calculation
          const githubXp =
            totalCommits * 10 +
            totalPRs * 50 +
            totalIssues * 20 +
            totalStars * 100;

          // Total authoritative XP = GitHub XP + Gamification XP
          const xp = githubXp + gamificationXp;
          const level = Math.floor(Math.sqrt(xp / 100)) + 1;
          const xpToNextLevel = Math.pow(level, 2) * 100;

          let tier: any = 'BRONZE';
          if (level >= 50) tier = 'GRANDMASTER';
          else if (level >= 40) tier = 'MASTER';
          else if (level >= 30) tier = 'DIAMOND';
          else if (level >= 20) tier = 'PLATINUM';
          else if (level >= 10) tier = 'GOLD';
          else if (level >= 5) tier = 'SILVER';

          await tx.developerRating.upsert({
            where: { userId },
            update: {
              overall: parseFloat((level * 10 + currentStreak * 2).toFixed(1)),
              level,
              githubXp,
              gamificationXp,
              xp,
              xpToNextLevel,
              tier,
              totalDevelopers: 250000, // mock total devs in network
              growthScore: Math.min(
                100,
                Math.floor(currentStreak * 5 + totalPRs / 2),
              ),
            },
            create: {
              userId,
              overall: parseFloat((level * 10 + currentStreak * 2).toFixed(1)),
              level,
              githubXp,
              gamificationXp,
              xp,
              xpToNextLevel,
              tier,
              totalDevelopers: 250000,
              growthScore: Math.min(
                100,
                Math.floor(currentStreak * 5 + totalPRs / 2),
              ),
            },
          });

          // 4. Process Recent Activities (Timeline)

          const recentActivities: {
            userId: string;
            type: import('@prisma/client').ActivityType;
            title: string;
            description: string;
            repository: string;
            createdAt: Date;
            githubEventId?: string;
            metadata?: { commitMessages: string[] };
          }[] = [];

          for (const [index, event] of githubEvents.entries()) {
            const started = recentActivities.length;
            if (event.type === 'PushEvent') {
              const commitMessages = pushMessages.get(index) ?? (Array.isArray(event.payload?.commits)
                ? event.payload.commits.map((commit: { message?: unknown }) => commit.message)
                    .filter((message: unknown): message is string => typeof message === 'string' && message.trim().length > 0)
                : []);
              const commitsCount = commitMessages.length || event.payload?.commits?.length || event.payload?.size || 0;
              if (commitsCount > 0 || event.payload?.head) {
                recentActivities.push({
                  userId,
                  type: 'COMMIT' as const,
                  title: commitsCount > 0 ? `Pushed ${commitsCount} commit${commitsCount > 1 ? 's' : ''}` : 'Pushed commits',
                  description: `Contributed to ${event.repo.name}`,
                  repository: event.repo.name,
                  createdAt: new Date(event.created_at),
                  ...(commitMessages.length > 0 ? { metadata: { commitMessages } } : {}),
                });
              }
            } else if (
              event.type === 'PullRequestEvent' &&
              event.payload?.action === 'opened'
            ) {
              recentActivities.push({
                userId,
                type: 'PULL_REQUEST' as const,
                title: 'Opened Pull Request',
                description:
                  event.payload?.pull_request?.title || 'Contributed code',
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (
              event.type === 'IssuesEvent' &&
              event.payload?.action === 'opened'
            ) {
              recentActivities.push({
                userId,
                type: 'ISSUE' as const,
                title: 'Opened Issue',
                description: event.payload?.issue?.title || 'Reported an issue',
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (
              event.type === 'WatchEvent' &&
              event.payload?.action === 'started'
            ) {
              recentActivities.push({
                userId,
                type: 'STAR' as const,
                title: 'Starred repository',
                description: event.repo.name,
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (event.type === 'ForkEvent') {
              recentActivities.push({
                userId,
                type: 'FORK' as const,
                title: 'Forked repository',
                description: event.repo.name,
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (
              event.type === 'CreateEvent' &&
              event.payload?.ref_type === 'repository'
            ) {
              recentActivities.push({
                userId,
                type: 'ACHIEVEMENT' as const,
                title: 'Created repository',
                description: event.repo.name,
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (event.type === 'PullRequestReviewEvent') {
              recentActivities.push({
                userId,
                type: 'REVIEW' as const,
                title: 'Reviewed Pull Request',
                description:
                  event.payload?.pull_request?.title || 'Code review',
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            } else if (event.type === 'IssueCommentEvent') {
              recentActivities.push({
                userId,
                type: 'REVIEW' as const,
                title: 'Left a comment',
                description: `Commented on ${event.payload?.issue?.pull_request ? 'Pull Request' : 'Issue'}`,
                repository: event.repo.name,
                createdAt: new Date(event.created_at),
              });
            }
            for (const activity of recentActivities.slice(started)) {
              if (!Number.isFinite(activity.createdAt.getTime()))
                throw new Error('Invalid GitHub activity date');
              activity.githubEventId = event.id
                ? `github:${event.id}`
                : `fallback:${createHash('sha256')
                    .update(
                      JSON.stringify([
                        activity.type,
                        activity.repository,
                        activity.createdAt.toISOString(),
                        activity.title,
                      ]),
                    )
                    .digest('hex')}`;
            }
          }

          // Keep all events returned by the latest sync so yesterday's work is not
          // dropped when the developer has more than 20 recent events.
          recentActivities.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );

          for (const activity of recentActivities) {
            const githubEventId = activity.githubEventId!;
            const keyed = await tx.activity.findUnique({
              where: { userId_githubEventId: { userId, githubEventId } },
            });
            // Adopt an exact legacy tuple once instead of duplicating historical rows.
            const legacy = keyed
              ? null
              : await tx.activity.findFirst({
                  where: {
                    userId,
                    githubEventId: null,
                    type: activity.type,
                    repository: activity.repository,
                    createdAt: activity.createdAt,
                  },
                });
            if (keyed || legacy) {
              await tx.activity.update({
                where: { id: (keyed || legacy)!.id },
                data: {
                  githubEventId,
                  title: activity.title,
                  description: activity.description,
                  repository: activity.repository,
                  ...(activity.metadata ? {
                    metadata: {
                      ...(((keyed || legacy)!.metadata ?? {}) as object),
                      ...activity.metadata,
                    } as Prisma.InputJsonValue,
                  } : {}),
                },
              });
            } else {
              await tx.activity.create({
                data: { ...activity, githubEventId },
              });
            }
          }

          // 5. Upsert GitHub-owned fields only; retain record identity/local metadata.
          const reposToSave = repos.map((repo: any) => ({
            githubRepoId: repo.id,
            userId,
            name: repo.name,
            fullName: repo.nameWithOwner || `${username}/${repo.name}`,
            description: repo.description || null,
            url: repo.url || `https://github.com/${username}/${repo.name}`,
            stars: repo.stargazerCount || 0,
            forks: repo.forkCount || 0,
            language: repo.primaryLanguage?.name || null,
            languageColor: repo.primaryLanguage?.color || null,
            topics:
              repo.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || [],
            commits: repo.defaultBranchRef?.target?.history?.totalCount || 0,
            issues: repo.issues?.totalCount || 0,
            pullRequests: repo.pullRequests?.totalCount || 0,
            contributors: 1,
            repoUpdatedAt: repo.updatedAt
              ? new Date(repo.updatedAt)
              : new Date(repo.createdAt),
            repoCreatedAt: new Date(repo.createdAt),
          }));

          for (const repo of reposToSave) {
            if (
              typeof repo.githubRepoId !== 'string' ||
              !repo.githubRepoId ||
              !Number.isFinite(repo.repoCreatedAt.getTime()) ||
              !Number.isFinite(repo.repoUpdatedAt.getTime())
            ) {
              throw new Error('Invalid GitHub repository identity or date');
            }
            const { userId: owner, githubRepoId, ...fields } = repo;
            await tx.repository.upsert({
              where: { userId_githubRepoId: { userId: owner, githubRepoId } },
              create: { ...repo, archivedAt: null },
              update: { ...fields, archivedAt: null },
            });
          }
          // A missing repo is not proof of deletion when GitHub returned only page 1.
          // Unknown completeness is conservative too (older/cached response shapes).
          if (githubData.repositories.pageInfo?.hasNextPage === false) {
            await tx.repository.updateMany({
              where: {
                userId,
                githubRepoId: {
                  notIn: reposToSave.map(
                    (repo: { githubRepoId: string }) => repo.githubRepoId,
                  ),
                },
                archivedAt: null,
              },
              data: { archivedAt: new Date() },
            });
          }
        },
        { timeout: 30000 },
      );
      this.logger.log(`Successfully synced data for ${username}`);
    } catch (error: any) {
      this.logger.error(
        `Error saving sync data for ${username}: ${error.message}`,
      );
      throw error;
    }
  }
}
