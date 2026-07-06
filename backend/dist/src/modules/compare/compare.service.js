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
exports.CompareService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CompareService = class CompareService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async compareDevelopers(username1, username2) {
        const [dev1, dev2] = await Promise.all([
            this.prisma.user.findUnique({ where: { username: username1 }, include: { stats: true, rating: true } }),
            this.prisma.user.findUnique({ where: { username: username2 }, include: { stats: true, rating: true } }),
        ]);
        if (!dev1)
            throw new common_1.NotFoundException(`User @${username1} not found`);
        if (!dev2)
            throw new common_1.NotFoundException(`User @${username2} not found`);
        return {
            developer1: {
                username: dev1.username,
                stats: dev1.stats,
                rating: dev1.rating,
            },
            developer2: {
                username: dev2.username,
                stats: dev2.stats,
                rating: dev2.rating,
            },
            comparison: {
                winner: (dev1.rating?.overall ?? 0) > (dev2.rating?.overall ?? 0) ? dev1.username : dev2.username,
                scoreDiff: Math.abs((dev1.rating?.overall ?? 0) - (dev2.rating?.overall ?? 0)),
            }
        };
    }
};
exports.CompareService = CompareService;
exports.CompareService = CompareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompareService);
//# sourceMappingURL=compare.service.js.map