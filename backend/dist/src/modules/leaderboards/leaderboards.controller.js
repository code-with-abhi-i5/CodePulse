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
exports.LeaderboardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leaderboards_service_1 = require("./leaderboards.service");
let LeaderboardsController = class LeaderboardsController {
    leaderboardsService;
    constructor(leaderboardsService) {
        this.leaderboardsService = leaderboardsService;
    }
    async getGlobalLeaderboard(limit) {
        return this.leaderboardsService.getGlobalLeaderboard(limit ? Number(limit) : 100);
    }
    async getLanguageLeaderboard(language, limit) {
        return this.leaderboardsService.getLanguageLeaderboard(language, limit ? Number(limit) : 50);
    }
};
exports.LeaderboardsController = LeaderboardsController;
__decorate([
    (0, common_1.Get)('global'),
    (0, swagger_1.ApiOperation)({ summary: 'Get global top developers based on overall rating' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getGlobalLeaderboard", null);
__decorate([
    (0, common_1.Get)('language'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leaderboard for a specific programming language' }),
    __param(0, (0, common_1.Query)('language')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getLanguageLeaderboard", null);
exports.LeaderboardsController = LeaderboardsController = __decorate([
    (0, swagger_1.ApiTags)('leaderboards'),
    (0, common_1.Controller)('leaderboards'),
    __metadata("design:paramtypes", [leaderboards_service_1.LeaderboardsService])
], LeaderboardsController);
//# sourceMappingURL=leaderboards.controller.js.map