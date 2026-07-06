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
exports.BadgesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const badges_service_1 = require("./badges.service");
let BadgesController = class BadgesController {
    badgesService;
    constructor(badgesService) {
        this.badgesService = badgesService;
    }
    async getAllBadges() {
        return this.badgesService.getAllBadges();
    }
    async getUserBadges(userId) {
        return this.badgesService.getUserBadges(userId);
    }
    async awardBadge(userId, badgeId) {
        return this.badgesService.awardBadge(userId, badgeId);
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available badges' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getAllBadges", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get badges earned by a user' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getUserBadges", null);
__decorate([
    (0, common_1.Post)('award/:userId/:badgeId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Award a badge to a user (Admin/Internal only)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('badgeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "awardBadge", null);
exports.BadgesController = BadgesController = __decorate([
    (0, swagger_1.ApiTags)('badges'),
    (0, common_1.Controller)('badges'),
    __metadata("design:paramtypes", [badges_service_1.BadgesService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map