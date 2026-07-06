"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const github_module_1 = require("./modules/github/github.module");
const sync_module_1 = require("./modules/sync/sync.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const compare_module_1 = require("./modules/compare/compare.module");
const challenges_module_1 = require("./modules/challenges/challenges.module");
const xp_module_1 = require("./modules/xp/xp.module");
const levels_module_1 = require("./modules/levels/levels.module");
const badges_module_1 = require("./modules/badges/badges.module");
const battles_module_1 = require("./modules/battles/battles.module");
const leaderboards_module_1 = require("./modules/leaderboards/leaderboards.module");
const friends_module_1 = require("./modules/friends/friends.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const reports_module_1 = require("./modules/reports/reports.module");
const search_module_1 = require("./modules/search/search.module");
const admin_module_1 = require("./modules/admin/admin.module");
const settings_module_1 = require("./modules/settings/settings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            github_module_1.GithubModule,
            sync_module_1.SyncModule,
            analytics_module_1.AnalyticsModule,
            compare_module_1.CompareModule,
            challenges_module_1.ChallengesModule,
            xp_module_1.XpModule,
            levels_module_1.LevelsModule,
            badges_module_1.BadgesModule,
            battles_module_1.BattlesModule,
            leaderboards_module_1.LeaderboardsModule,
            friends_module_1.FriendsModule,
            notifications_module_1.NotificationsModule,
            reports_module_1.ReportsModule,
            search_module_1.SearchModule,
            admin_module_1.AdminModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map