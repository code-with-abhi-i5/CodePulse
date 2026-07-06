import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GithubModule } from './modules/github/github.module';
import { SyncModule } from './modules/sync/sync.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CompareModule } from './modules/compare/compare.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { XpModule } from './modules/xp/xp.module';
import { LevelsModule } from './modules/levels/levels.module';
import { BadgesModule } from './modules/badges/badges.module';
import { BattlesModule } from './modules/battles/battles.module';
import { LeaderboardsModule } from './modules/leaderboards/leaderboards.module';
import { FriendsModule } from './modules/friends/friends.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GithubModule,
    SyncModule,
    AnalyticsModule,
    CompareModule,
    ChallengesModule,
    XpModule,
    LevelsModule,
    BadgesModule,
    BattlesModule,
    LeaderboardsModule,
    FriendsModule,
    NotificationsModule,
    ReportsModule,
    SearchModule,
    AdminModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
