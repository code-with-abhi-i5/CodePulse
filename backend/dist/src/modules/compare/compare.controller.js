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
exports.CompareController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const compare_service_1 = require("./compare.service");
const compare_dto_1 = require("./dto/compare.dto");
let CompareController = class CompareController {
    compareService;
    constructor(compareService) {
        this.compareService = compareService;
    }
    async compare(query) {
        return this.compareService.compareDevelopers(query.username1, query.username2);
    }
};
exports.CompareController = CompareController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Compare two developers by username' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compare_dto_1.CompareDevelopersDto]),
    __metadata("design:returntype", Promise)
], CompareController.prototype, "compare", null);
exports.CompareController = CompareController = __decorate([
    (0, swagger_1.ApiTags)('compare'),
    (0, common_1.Controller)('compare'),
    __metadata("design:paramtypes", [compare_service_1.CompareService])
], CompareController);
//# sourceMappingURL=compare.controller.js.map