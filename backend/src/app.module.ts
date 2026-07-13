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
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_PASSWORD ? {} : undefined,
      },
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 1000, 
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_PASSWORD ? {} : undefined,
    }),
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
