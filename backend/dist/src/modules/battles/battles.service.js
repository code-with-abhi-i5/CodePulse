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
exports.BattlesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BattlesService = class BattlesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveBattles() {
        return this.prisma.battle.findMany({
            where: { status: 'ACTIVE' },
            include: {
                challenger: { select: { id: true, username: true, avatar: true } },
                opponent: { select: { id: true, username: true, avatar: true } },
            },
        });
    }
    async getUserBattles(userId) {
        return this.prisma.battle.findMany({
            where: {
                OR: [{ challengerId: userId }, { opponentId: userId }],
            },
            include: {
                challenger: { select: { id: true, username: true, avatar: true } },
                opponent: { select: { id: true, username: true, avatar: true } },
                winner: { select: { id: true, username: true } },
            },
            orderBy: { startedAt: 'desc' },
        });
    }
    async createBattle(dto) {
        return this.prisma.battle.create({
            data: {
                ...dto,
                endsAt: new Date(dto.endsAt),
            },
        });
    }
    async updateBattleStatus(battleId, dto) {
        const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });
        if (!battle) {
            throw new common_1.NotFoundException(`Battle ${battleId} not found`);
        }
        return this.prisma.battle.update({
            where: { id: battleId },
            data: {
                status: dto.status,
                winnerId: dto.winnerId,
            },
        });
    }
};
exports.BattlesService = BattlesService;
exports.BattlesService = BattlesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BattlesService);
//# sourceMappingURL=battles.service.js.map