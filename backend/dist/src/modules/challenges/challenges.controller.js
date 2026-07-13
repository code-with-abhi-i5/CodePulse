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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const challenges_service_1 = require("./challenges.service");
const challenges_dto_1 = require("./dto/challenges.dto");
let ChallengesController = class ChallengesController {
    challengesService;
    constructor(challengesService) {
        this.challengesService = challengesService;
    }
    async getActiveChallenges() {
        return this.challengesService.getActiveChallenges();
    }
    async getMyChallenges() {
        const mockUserId = '123';
        return this.challengesService.getUserChallenges(mockUserId);
    }
    async createChallenge(dto) {
        return this.challengesService.createChallenge(dto);
    }
    async triggerDailyChallenges() {
        await this.challengesService.generateDailyChallenges();
        return { success: true, message: 'Daily challenges generated' };
    }
};
exports.ChallengesController = ChallengesController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active challenges' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getActiveChallenges", null);
__decorate([
    (0, common_1.Get)('user/me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get challenges for current user' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getMyChallenges", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new challenge (Admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [challenges_dto_1.CreateChallengeDto]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "createChallenge", null);
__decorate([
    (0, common_1.Post)('trigger'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger generation of daily challenges (Admin/Dev)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "triggerDailyChallenges", null);
exports.ChallengesController = ChallengesController = __decorate([
    (0, swagger_1.ApiTags)('challenges'),
    (0, common_1.Controller)('challenges'),
    __metadata("design:paramtypes", [challenges_service_1.ChallengesService])
], ChallengesController);
//# sourceMappingURL=challenges.controller.js.map