"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const github_service_1 = require("../github/github.service");
let SyncService = SyncService_1 = class SyncService {
    prisma;
    github;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(prisma, github) {
        this.prisma = prisma;
        this.github = github;
    }
    async syncUserData(userId, username, accessToken) {
        this.logger.log(`Starting GitHub sync for ${username}`);
        const githubData = await this.github.fetchUserData(username, accessToken);
        if (!githubData) {
            this.logger.warn(`Failed to sync data for ${username}`);
            return;
        }
        try {
            const totalCommits = githubData.contributionsCollection?.totalCommitContributions || 0;
            const totalPRs = githubData.contributionsCollection?.totalPullRequestContributions || 0;
            const totalIssues = githubData.contributionsCollection?.totalIssueContributions || 0;
            const repos = githubData.repositories?.nodes || [];
            const followers = githubData.followers?.totalCount || 0;
            const following = githubData.following?.totalCount || 0;
            let totalStars = 0;
            let totalForks = 0;
            const languageMap = new Map();
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
            const days = githubData.contributionsCollection?.contributionCalendar?.weeks?.flatMap((w) => w.contributionDays) || [];
            let currentStreak = 0;
            for (let i = days.length - 1; i >= 0; i--) {
                if (days[i].contributionCount > 0) {
                    currentStreak++;
                }
                else if (i < days.length - 1) {
                    break;
                }
            }
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
            const socialLinks = githubData.socialAccounts?.nodes?.map((node) => ({
                provider: node.provider,
                url: node.url,
            })) || [];
            if (socialLinks.length > 0) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { socialLinks },
                });
            }
            const totalLangCount = Array.from(languageMap.values()).reduce((sum, val) => sum + val.count, 0);
            for (const [name, data] of languageMap.entries()) {
                const percentage = totalLangCount > 0 ? (data.count / totalLangCount) * 100 : 0;
                await this.prisma.languageStat.upsert({
                    where: { userId_name: { userId, name } },
                    update: {
                        color: data.color,
                        percentage: parseFloat(percentage.toFixed(1)),
                        repos: data.count,
                        linesOfCode: data.count * 1250,
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
            const xp = (totalCommits * 10) + (totalPRs * 50) + (totalIssues * 20) + (totalStars * 100);
            const level = Math.floor(Math.sqrt(xp / 100)) + 1;
            const xpToNextLevel = Math.pow(level, 2) * 100;
            let tier = 'BRONZE';
            if (level >= 50)
                tier = 'GRANDMASTER';
            else if (level >= 40)
                tier = 'MASTER';
            else if (level >= 30)
                tier = 'DIAMOND';
            else if (level >= 20)
                tier = 'PLATINUM';
            else if (level >= 10)
                tier = 'GOLD';
            else if (level >= 5)
                tier = 'SILVER';
            await this.prisma.developerRating.upsert({
                where: { userId },
                update: {
                    overall: parseFloat(((level * 10) + (currentStreak * 2)).toFixed(1)),
                    level,
                    xp,
                    xpToNextLevel,
                    tier,
                    totalDevelopers: 250000,
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
            await this.prisma.activity.deleteMany({ where: { userId } });
            const recentActivities = [];
            const githubEvents = await this.github.fetchUserEvents(username, accessToken) || [];
            for (const event of githubEvents) {
                if (event.type === 'PushEvent') {
                    const commitsCount = event.payload?.commits?.length || 0;
                    if (commitsCount > 0) {
                        recentActivities.push({
                            userId,
                            type: 'COMMIT',
                            title: `Pushed ${commitsCount} commit${commitsCount > 1 ? 's' : ''}`,
                            description: `Contributed to ${event.repo.name}`,
                            repository: event.repo.name,
                            createdAt: new Date(event.created_at),
                        });
                    }
                }
                else if (event.type === 'PullRequestEvent' && event.payload?.action === 'opened') {
                    recentActivities.push({
                        userId,
                        type: 'PULL_REQUEST',
                        title: 'Opened Pull Request',
                        description: event.payload?.pull_request?.title || 'Contributed code',
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'IssuesEvent' && event.payload?.action === 'opened') {
                    recentActivities.push({
                        userId,
                        type: 'ISSUE',
                        title: 'Opened Issue',
                        description: event.payload?.issue?.title || 'Reported an issue',
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'WatchEvent' && event.payload?.action === 'started') {
                    recentActivities.push({
                        userId,
                        type: 'STAR',
                        title: 'Starred repository',
                        description: event.repo.name,
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'ForkEvent') {
                    recentActivities.push({
                        userId,
                        type: 'FORK',
                        title: 'Forked repository',
                        description: event.repo.name,
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'CreateEvent' && event.payload?.ref_type === 'repository') {
                    recentActivities.push({
                        userId,
                        type: 'ACHIEVEMENT',
                        title: 'Created repository',
                        description: event.repo.name,
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'PullRequestReviewEvent') {
                    recentActivities.push({
                        userId,
                        type: 'REVIEW',
                        title: 'Reviewed Pull Request',
                        description: event.payload?.pull_request?.title || 'Code review',
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
                else if (event.type === 'IssueCommentEvent') {
                    recentActivities.push({
                        userId,
                        type: 'REVIEW',
                        title: 'Left a comment',
                        description: `Commented on ${event.payload?.issue?.pull_request ? 'Pull Request' : 'Issue'}`,
                        repository: event.repo.name,
                        createdAt: new Date(event.created_at),
                    });
                }
            }
            recentActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            if (recentActivities.length > 0) {
                await this.prisma.activity.createMany({
                    data: recentActivities.slice(0, 20),
                });
            }
            await this.prisma.repository.deleteMany({ where: { userId } });
            const reposToSave = repos.map((repo) => ({
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
                topics: repo.repositoryTopics?.nodes?.map((n) => n.topic.name) || [],
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
        }
        catch (error) {
            this.logger.error(`Error saving sync data for ${username}: ${error.message}`);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        github_service_1.GithubService])
], SyncService);
//# sourceMappingURL=sync.service.js.map