import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from '../github/github.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
  ) {}

  async syncUserData(userId: string, username: string, accessToken: string) {
    this.logger.log(`Starting GitHub sync for ${username}`);
    const githubData = await this.github.fetchUserData(username, accessToken);
    
    if (!githubData) {
      this.logger.warn(`Failed to sync data for ${username}`);
      return;
    }

    try {
      // 1. Process Stats
      const totalCommits = githubData.contributionsCollection?.totalCommitContributions || 0;
      const totalPRs = githubData.contributionsCollection?.totalPullRequestContributions || 0;
      const totalIssues = githubData.contributionsCollection?.totalIssueContributions || 0;
      const repos = githubData.repositories?.nodes || [];
      const followers = githubData.followers?.totalCount || 0;
      const following = githubData.following?.totalCount || 0;
      
      let totalStars = 0;
      let totalForks = 0;
      const languageMap = new Map<string, { count: number; color: string }>();

      for (const repo of repos) {
        totalStars += repo.stargazerCount || 0;
        totalForks += repo.forkCount || 0;
        if (repo.primaryLanguage) {
          const lang = repo.primaryLanguage;
          const current = languageMap.get(lang.name) || { count: 0, color: lang.color };
          current.count += 1;
          languageMap.set(lang.name, current);
        }
      }

      // Calculate streak
      const days = githubData.contributionsCollection?.contributionCalendar?.weeks?.flatMap((w: any) => w.contributionDays) || [];
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
      const weeks = githubData.contributionsCollection?.contributionCalendar?.weeks || [];
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

      await this.prisma.developerStats.upsert({
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
        }
      });

      // 2. Process Languages
      const totalLangCount = Array.from(languageMap.values()).reduce((sum, val) => sum + val.count, 0);
      for (const [name, data] of languageMap.entries()) {
        const percentage = totalLangCount > 0 ? (data.count / totalLangCount) * 100 : 0;
        await this.prisma.languageStat.upsert({
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
          }
        });
      }

      // 3. Process Rating & XP
      // Base calculation
      const xp = (totalCommits * 10) + (totalPRs * 50) + (totalIssues * 20) + (totalStars * 100);
      const level = Math.floor(Math.sqrt(xp / 100)) + 1;
      const xpToNextLevel = Math.pow(level, 2) * 100;
      
      let tier: any = 'BRONZE';
      if (level >= 50) tier = 'GRANDMASTER';
      else if (level >= 40) tier = 'MASTER';
      else if (level >= 30) tier = 'DIAMOND';
      else if (level >= 20) tier = 'PLATINUM';
      else if (level >= 10) tier = 'GOLD';
      else if (level >= 5) tier = 'SILVER';

      await this.prisma.developerRating.upsert({
        where: { userId },
        update: {
          overall: parseFloat(((level * 10) + (currentStreak * 2)).toFixed(1)),
          level,
          xp,
          xpToNextLevel,
          tier,
          totalDevelopers: 250000, // mock total devs in network
          growthScore: Math.min(100, Math.floor(currentStreak * 5 + (totalPRs / 2))),
        },
        create: {
          userId,
          overall: parseFloat(((level * 10) + (currentStreak * 2)).toFixed(1)),
          level,
          xp,
          xpToNextLevel,
          tier,
          totalDevelopers: 250000,
          growthScore: Math.min(100, Math.floor(currentStreak * 5 + (totalPRs / 2))),
        }
      });

      // 4. Process Recent Activities (Timeline)
      await this.prisma.activity.deleteMany({ where: { userId } });
      const recentActivities = [];
      
      const prs = githubData.pullRequests?.nodes || [];
      for (const pr of prs) {
        recentActivities.push({
          userId,
          type: 'PULL_REQUEST' as const,
          title: 'Opened Pull Request',
          description: pr.title,
          repository: pr.repository?.name,
          createdAt: new Date(pr.createdAt),
        });
      }

      const issues = githubData.issues?.nodes || [];
      for (const issue of issues) {
        recentActivities.push({
          userId,
          type: 'ISSUE' as const,
          title: 'Opened Issue',
          description: issue.title,
          repository: issue.repository?.name,
          createdAt: new Date(issue.createdAt),
        });
      }

      // Sort activities by date DESC and take top 20
      recentActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (recentActivities.length > 0) {
        await this.prisma.activity.createMany({
          data: recentActivities.slice(0, 20),
        });
      }

      // 5. Process Repositories
      await this.prisma.repository.deleteMany({ where: { userId } });
      const reposToSave = repos.map((repo: any) => ({
        githubRepoId: repo.id || `${username}-${repo.name}`,
        userId,
        name: repo.name,
        fullName: repo.nameWithOwner || `${username}/${repo.name}`,
        description: repo.description || null,
        url: repo.url || `https://github.com/${username}/${repo.name}`,
        stars: repo.stargazerCount || 0,
        forks: repo.forkCount || 0,
        language: repo.primaryLanguage?.name || null,
        languageColor: repo.primaryLanguage?.color || null,
        topics: repo.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || [],
        commits: repo.defaultBranchRef?.target?.history?.totalCount || 0,
        issues: repo.issues?.totalCount || 0,
        pullRequests: repo.pullRequests?.totalCount || 0,
        contributors: 1,
        repoUpdatedAt: repo.updatedAt ? new Date(repo.updatedAt) : new Date(repo.createdAt),
        repoCreatedAt: new Date(repo.createdAt),
      }));

      if (reposToSave.length > 0) {
        await this.prisma.repository.createMany({
          data: reposToSave,
        });
      }

      this.logger.log(`Successfully synced data for ${username}`);
    } catch (error: any) {
      this.logger.error(`Error saving sync data for ${username}: ${error.message}`);
    }
  }
}
