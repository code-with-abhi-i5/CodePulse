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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LeaderboardWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const github_sync_service_1 = require("./github-sync.service");
const ranking_service_1 = require("./ranking.service");
const country_normalizer_service_1 = require("./country-normalizer.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
let LeaderboardWorker = LeaderboardWorker_1 = class LeaderboardWorker extends bullmq_1.WorkerHost {
    prisma;
    githubSync;
    ranking;
    normalizer;
    cacheManager;
    logger = new common_1.Logger(LeaderboardWorker_1.name);
    constructor(prisma, githubSync, ranking, normalizer, cacheManager) {
        super();
        this.prisma = prisma;
        this.githubSync = githubSync;
        this.ranking = ranking;
        this.normalizer = normalizer;
        this.cacheManager = cacheManager;
    }
    async process(job) {
        this.logger.log(`Processing job: ${job.name}`);
        if (job.name === 'sync-user') {
            const { username, overrideToken } = job.data;
            return this.syncUser(username, overrideToken);
        }
        if (job.name === 'daily-sync') {
            return this.syncStaleUsers();
        }
    }
    async syncUser(username, overrideToken) {
        this.logger.log(`Syncing user: ${username}`);
        const stats = await this.githubSync.fetchPublicStats(username, overrideToken);
        if (!stats) {
            this.logger.warn(`Could not fetch stats for ${username}`);
            return;
        }
        const score = this.ranking.calculateScore(stats);
        const country = this.normalizer.normalize(stats.location);
        await this.prisma.githubUser.upsert({
            where: { username: stats.username },
            update: {
                name: stats.name,
                avatarUrl: stats.avatarUrl,
                bio: stats.bio,
                company: stats.company,
                location: stats.location,
                country,
                primaryLanguage: stats.primaryLanguage,
                followers: stats.followers,
                following: stats.following,
                publicRepos: stats.publicRepos,
                totalStars: stats.totalStars,
                totalForks: stats.totalForks,
                score,
                lastSyncedAt: new Date(),
            },
            create: {
                githubId: stats.githubId,
                username: stats.username,
                name: stats.name,
                avatarUrl: stats.avatarUrl,
                bio: stats.bio,
                company: stats.company,
                location: stats.location,
                country,
                primaryLanguage: stats.primaryLanguage,
                followers: stats.followers,
                following: stats.following,
                publicRepos: stats.publicRepos,
                totalStars: stats.totalStars,
                totalForks: stats.totalForks,
                score,
            },
        });
        this.logger.log(`Successfully synced ${username}`);
    }
    async syncStaleUsers() {
        this.logger.log('Starting daily sync for stale users');
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        const staleUsers = await this.prisma.githubUser.findMany({
            where: {
                lastSyncedAt: { lt: yesterday }
            },
            orderBy: { score: 'desc' },
            take: 100
        });
        for (const user of staleUsers) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.syncUser(user.username);
        }
        this.logger.log('Finished daily sync batch');
    }
};
exports.LeaderboardWorker = LeaderboardWorker;
exports.LeaderboardWorker = LeaderboardWorker = LeaderboardWorker_1 = __decorate([
    (0, bullmq_1.Processor)('leaderboard-sync'),
    __param(4, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        github_sync_service_1.GithubSyncService,
        ranking_service_1.RankingService,
        country_normalizer_service_1.CountryNormalizerService, Object])
], LeaderboardWorker);
//# sourceMappingURL=leaderboard.worker.js.map