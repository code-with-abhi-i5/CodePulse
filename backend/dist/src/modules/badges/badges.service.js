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
exports.BadgesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BadgesService = class BadgesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllBadges() {
        return this.prisma.badge.findMany();
    }
    async getUserBadges(userId) {
        return this.prisma.userBadge.findMany({
            where: { userId },
            include: { badge: true },
        });
    }
    async awardBadge(userId, badgeId) {
        const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
        if (!badge) {
            throw new common_1.NotFoundException(`Badge ${badgeId} not found`);
        }
        return this.prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId } },
            update: {},
            create: { userId, badgeId },
        });
    }
};
exports.BadgesService = BadgesService;
exports.BadgesService = BadgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BadgesService);
//# sourceMappingURL=badges.service.js.map