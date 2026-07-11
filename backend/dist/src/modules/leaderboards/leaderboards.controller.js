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
const leaderboards_service_1 = require("./leaderboards.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let LeaderboardsController = class LeaderboardsController {
    leaderboardsService;
    constructor(leaderboardsService) {
        this.leaderboardsService = leaderboardsService;
    }
    async getGlobalLeaderboard(cursor, limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return this.leaderboardsService.getGlobalLeaderboard(cursor, parsedLimit);
    }
    async getIndiaLeaderboard(cursor, limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return this.leaderboardsService.getIndiaLeaderboard(cursor, parsedLimit);
    }
    async getFriendsLeaderboard(req, cursor, limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return this.leaderboardsService.getFriendsLeaderboard(req.user.id, cursor, parsedLimit);
    }
    async getUserProfile(username) {
        return this.leaderboardsService.searchProfile(username);
    }
};
exports.LeaderboardsController = LeaderboardsController;
__decorate([
    (0, common_1.Get)('global'),
    (0, swagger_1.ApiOperation)({ summary: 'Get global leaderboard' }),
    (0, swagger_1.ApiQuery)({ name: 'cursor', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('cursor')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getGlobalLeaderboard", null);
__decorate([
    (0, common_1.Get)('india'),
    (0, swagger_1.ApiOperation)({ summary: 'Get India leaderboard' }),
    (0, swagger_1.ApiQuery)({ name: 'cursor', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('cursor')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getIndiaLeaderboard", null);
__decorate([
    (0, common_1.Get)('friends'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get friends leaderboard' }),
    (0, swagger_1.ApiQuery)({ name: 'cursor', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('cursor')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getFriendsLeaderboard", null);
__decorate([
    (0, common_1.Get)('user/:username'),
    (0, swagger_1.ApiOperation)({ summary: 'Search and get specific user profile stats' }),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaderboardsController.prototype, "getUserProfile", null);
exports.LeaderboardsController = LeaderboardsController = __decorate([
    (0, swagger_1.ApiTags)('Leaderboards'),
    (0, common_1.Controller)('leaderboards'),
    __metadata("design:paramtypes", [leaderboards_service_1.LeaderboardsService])
], LeaderboardsController);
//# sourceMappingURL=leaderboards.controller.js.map