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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ChallengesService = class ChallengesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveChallenges() {
        return this.prisma.challenge.findMany({
            where: { expiresAt: { gt: new Date() } },
        });
    }
    async getUserChallenges(userId) {
        return this.prisma.userChallenge.findMany({
            where: { userId },
            include: { challenge: true },
        });
    }
    async createChallenge(dto) {
        return this.prisma.challenge.create({
            data: {
                ...dto,
                expiresAt: new Date(dto.expiresAt),
            },
        });
    }
    async processUserActivity(userId, category, count = 1) {
        const activeChallenges = await this.prisma.challenge.findMany({
            where: {
                category,
                expiresAt: { gt: new Date() },
            },
        });
        for (const challenge of activeChallenges) {
            let userChallenge = await this.prisma.userChallenge.findUnique({
                where: {
                    userId_challengeId: {
                        userId,
                        challengeId: challenge.id,
                    },
                },
            });
            if (!userChallenge) {
                userChallenge = await this.prisma.userChallenge.create({
                    data: {
                        userId,
                        challengeId: challenge.id,
                        progress: 0,
                        isCompleted: false,
                    },
                });
            }
            if (userChallenge.isCompleted) {
                continue;
            }
            const newProgress = Math.min(userChallenge.progress + count, challenge.target);
            const isCompleted = newProgress >= challenge.target;
            await this.prisma.userChallenge.update({
                where: { id: userChallenge.id },
                data: {
                    progress: newProgress,
                    isCompleted,
                    completedAt: isCompleted ? new Date() : null,
                },
            });
            if (isCompleted) {
                await this.prisma.developerRating.updateMany({
                    where: { userId },
                    data: {
                        xp: { increment: challenge.xpReward },
                    },
                });
                await this.prisma.notification.create({
                    data: {
                        userId,
                        type: 'CHALLENGE',
                        title: 'Challenge Completed! 🎉',
                        message: `You completed the "${challenge.title}" challenge and earned ${challenge.xpReward} XP.`,
                    },
                });
            }
        }
    }
    async generateDailyChallenges() {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setHours(23, 59, 59, 999);
        const templates = [
            {
                title: 'Daily Committer',
                description: 'Make 3 commits today',
                type: 'DAILY',
                difficulty: 'EASY',
                xpReward: 50,
                target: 3,
                category: 'COMMITS',
                icon: 'Flame'
            },
            {
                title: 'Bug Squasher',
                description: 'Close 1 issue today',
                type: 'DAILY',
                difficulty: 'MEDIUM',
                xpReward: 70,
                target: 1,
                category: 'ISSUES',
                icon: 'Target'
            },
            {
                title: 'Weekly Warrior',
                description: 'Make 15 commits this week',
                type: 'WEEKLY',
                difficulty: 'MEDIUM',
                xpReward: 200,
                target: 15,
                category: 'COMMITS',
                icon: 'Calendar'
            },
            {
                title: 'Monthly Master',
                description: 'Earn 1000 stars this month',
                type: 'MONTHLY',
                difficulty: 'HARD',
                xpReward: 1000,
                target: 1000,
                category: 'STARS',
                icon: 'Trophy'
            },
            {
                title: 'Winter Coder',
                description: 'Contribute for 30 days during winter season',
                type: 'SEASONAL',
                difficulty: 'LEGENDARY',
                xpReward: 5000,
                target: 30,
                category: 'STREAK',
                icon: 'Sparkles'
            }
        ];
        for (const template of templates) {
            await this.prisma.challenge.create({
                data: {
                    ...template,
                    expiresAt
                }
            });
        }
    }
};
exports.ChallengesService = ChallengesService;
exports.ChallengesService = ChallengesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChallengesService);
//# sourceMappingURL=challenges.service.js.map