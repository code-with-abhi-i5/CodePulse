import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { DynamicConfigModule } from './config/dynamic-config.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { SecurityModule } from './modules/security/security.module';
import { HealthModule } from './modules/health/health.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { CloudModule } from './modules/cloud/cloud.module';
import { GraphModule } from './modules/graph/graph.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { StorageModule } from './modules/storage/storage.module';
import { EsportsModule } from './modules/esports/esports.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { IdentityModule } from './modules/identity/identity.module';
import { GraphqlGatewayModule } from './modules/graphql/graphql.module';
import { McpModule } from './modules/mcp/mcp.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CollabModule } from './modules/collab/collab.module';
import { AudioModule } from './modules/audio/audio.module';
import { AiModule } from './modules/ai/ai.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { OpsModule } from './modules/ops/ops.module';
import { GrpcModule } from './modules/grpc/grpc.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

import { RealtimeModule } from './modules/realtime/realtime.module';

import { SreModule } from './modules/sre/sre.module';



import { LspModule } from './modules/lsp/lsp.module';

import { LoggingModule } from './common/logging/logging.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { TokenBucketRateLimitGuard } from './common/guards/token-bucket-rate-limit.guard';
import { GuardsModule } from './common/guards/guards.module';
import { SystemMetricsService } from './common/services/system-metrics.service';
import { LoadShedderMiddleware } from './common/middleware/load-shedder.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CommonModule } from './common/common.module';
import { VaultModule } from './common/vault/vault.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        tls:
          process.env.REDIS_TLS === 'true'
            ? {}
            : process.env.REDIS_TLS === 'false' ||
              ['redis', 'localhost', '127.0.0.1'].includes(process.env.REDIS_HOST || 'localhost')
            ? undefined
            : process.env.REDIS_PASSWORD
            ? {}
            : undefined,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (process.env.CI_SMOKE_BOOT === 'true') {
            return null;
          }
          return Math.min(times * 100, 3000);
        },
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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
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
    RecommendationsModule,
    MetricsModule,
    DynamicConfigModule,
    RepositoriesModule,
    SecurityModule,
    HealthModule,
    ExecutionModule,
    CloudModule,
    GraphModule,
    ObservabilityModule,
    SreModule,
    StorageModule,
    EsportsModule,
    CryptoModule,
    IdentityModule,
    GuardsModule,
    CommonModule,
    VaultModule,
    GraphqlGatewayModule,
    McpModule,
    WebhooksModule,
    GrpcModule,
    CollabModule,
    LoggingModule,
    MentorshipModule,
    GamificationModule,
    AudioModule,
    AiModule,
    TournamentsModule,
    OpsModule,
    TelemetryModule,

    RealtimeModule,



    LspModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SystemMetricsService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoadShedderMiddleware, CsrfMiddleware).forRoutes('*path');
  }
}
