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
exports.BattlesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const battles_service_1 = require("./battles.service");
const battles_dto_1 = require("./dto/battles.dto");
let BattlesController = class BattlesController {
    battlesService;
    constructor(battlesService) {
        this.battlesService = battlesService;
    }
    async getActiveBattles() {
        return this.battlesService.getActiveBattles();
    }
    async getUserBattles(userId) {
        return this.battlesService.getUserBattles(userId);
    }
    async createBattle(dto) {
        return this.battlesService.createBattle(dto);
    }
    async updateBattleStatus(id, dto) {
        return this.battlesService.updateBattleStatus(id, dto);
    }
};
exports.BattlesController = BattlesController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active global battles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BattlesController.prototype, "getActiveBattles", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get battles for a specific user' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BattlesController.prototype, "getUserBattles", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Challenge a user to a battle' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [battles_dto_1.CreateBattleDto]),
    __metadata("design:returntype", Promise)
], BattlesController.prototype, "createBattle", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update battle status (e.g., mark as completed and declare winner)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, battles_dto_1.UpdateBattleStatusDto]),
    __metadata("design:returntype", Promise)
], BattlesController.prototype, "updateBattleStatus", null);
exports.BattlesController = BattlesController = __decorate([
    (0, swagger_1.ApiTags)('battles'),
    (0, common_1.Controller)('battles'),
    __metadata("design:paramtypes", [battles_service_1.BattlesService])
], BattlesController);
//# sourceMappingURL=battles.controller.js.map