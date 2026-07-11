"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const leaderboards_controller_1 = require("./leaderboards.controller");
const leaderboards_service_1 = require("./leaderboards.service");
const github_sync_service_1 = require("./github-sync.service");
const ranking_service_1 = require("./ranking.service");
const country_normalizer_service_1 = require("./country-normalizer.service");
const leaderboard_worker_1 = require("./leaderboard.worker");
let LeaderboardsModule = class LeaderboardsModule {
};
exports.LeaderboardsModule = LeaderboardsModule;
exports.LeaderboardsModule = LeaderboardsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'leaderboard-sync',
            }),
        ],
        controllers: [leaderboards_controller_1.LeaderboardsController],
        providers: [
            leaderboards_service_1.LeaderboardsService,
            github_sync_service_1.GithubSyncService,
            ranking_service_1.RankingService,
            country_normalizer_service_1.CountryNormalizerService,
            leaderboard_worker_1.LeaderboardWorker,
        ],
        exports: [leaderboards_service_1.LeaderboardsService],
    })
], LeaderboardsModule);
//# sourceMappingURL=leaderboards.module.js.map