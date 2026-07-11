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
var LeaderboardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardsService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_service_1 = require("../../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const github_sync_service_1 = require("./github-sync.service");
let LeaderboardsService = LeaderboardsService_1 = class LeaderboardsService {
    prisma;
    cacheManager;
    syncQueue;
    githubSync;
    logger = new common_1.Logger(LeaderboardsService_1.name);
    constructor(prisma, cacheManager, syncQueue, githubSync) {
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.syncQueue = syncQueue;
        this.githubSync = githubSync;
    }
    async getGlobalLeaderboard(cursor, limit = 20) {
        const cacheKey = `leaderboard:global:${cursor || 'first'}:${limit}`;
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const data = await this.prisma.githubUser.findMany({
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { score: 'desc' },
        });
        let nextCursor = null;
        if (data.length > limit) {
            const nextItem = data.pop();
            if (nextItem)
                nextCursor = nextItem.id;
        }
        const result = { data, nextCursor };
        await this.cacheManager.set(cacheKey, result, 600000);
        return result;
    }
    async getIndiaLeaderboard(cursor, limit = 20) {
        const cacheKey = `leaderboard:india:${cursor || 'first'}:${limit}`;
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const data = await this.prisma.githubUser.findMany({
            where: { country: 'India' },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { score: 'desc' },
        });
        let nextCursor = null;
        if (data.length > limit) {
            const nextItem = data.pop();
            if (nextItem)
                nextCursor = nextItem.id;
        }
        const result = { data, nextCursor };
        await this.cacheManager.set(cacheKey, result, 600000);
        return result;
    }
    async getFriendsLeaderboard(userId, cursor, limit = 20) {
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true }
        });
        if (!currentUser)
            return { data: [], nextCursor: null };
        const username = currentUser.username;
        const cacheKey = `leaderboard:friends:${username}:${cursor || 'first'}:${limit}`;
        const cachedData = await this.cacheManager.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        const cacheKeyNetwork = `github_network:${username}`;
        let usernames = await this.cacheManager.get(cacheKeyNetwork) || [];
        if (!usernames || usernames.length === 0) {
            const [following, followers] = await Promise.all([
                this.githubSync.fetchNetwork(username, undefined, 'following', 50),
                this.githubSync.fetchNetwork(username, undefined, 'followers', 50)
            ]);
            usernames = Array.from(new Set([...following, ...followers]));
            await this.cacheManager.set(cacheKeyNetwork, usernames, 86400000);
            usernames.forEach(friend => {
                this.syncQueue.add('sync-user', { username: friend });
            });
        }
        if (usernames.length === 0)
            return { data: [], nextCursor: null };
        const data = await this.prisma.githubUser.findMany({
            where: { username: { in: usernames } },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { score: 'desc' },
        });
        let nextCursor = null;
        if (data.length > limit) {
            const nextItem = data.pop();
            if (nextItem)
                nextCursor = nextItem.id;
        }
        const result = { data, nextCursor };
        if (data.length > 0) {
            await this.cacheManager.set(cacheKey, result, 86400000);
        }
        return result;
    }
    async searchProfile(username) {
        const user = await this.prisma.githubUser.findUnique({
            where: { username: username.toLowerCase() }
        });
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        if (!user || user.lastSyncedAt < oneDayAgo) {
            this.logger.log(`Dispatching background sync for ${username}`);
            await this.syncQueue.add('sync-user', { username });
        }
        return user;
    }
};
exports.LeaderboardsService = LeaderboardsService;
exports.LeaderboardsService = LeaderboardsService = LeaderboardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, bullmq_1.InjectQueue)('leaderboard-sync')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, bullmq_2.Queue,
        github_sync_service_1.GithubSyncService])
], LeaderboardsService);
//# sourceMappingURL=leaderboards.service.js.map