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
exports.XpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let XpService = class XpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addXp(dto) {
        const rating = await this.prisma.developerRating.findUnique({
            where: { userId: dto.userId },
        });
        if (!rating) {
            throw new common_1.NotFoundException(`Developer rating not found for user ${dto.userId}`);
        }
        const newXp = rating.xp + dto.amount;
        return this.prisma.developerRating.update({
            where: { userId: dto.userId },
            data: { xp: newXp },
        });
    }
};
exports.XpService = XpService;
exports.XpService = XpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], XpService);
//# sourceMappingURL=xp.service.js.map