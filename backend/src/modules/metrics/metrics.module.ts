import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { MetricsInterceptor } from '../../common/interceptors/metrics.interceptor';
import { MetricsBasicAuthGuard } from './metrics-basic-auth.guard';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { RedisStreamsModule } from '../../common/redis/redis-streams.module';
import { HighCardinalityIndexerService } from './high-cardinality-indexer.service';
import { MetricCompactorService } from './metric-compactor.service';

@Module({
  imports: [PrismaModule, QueuesModule, RedisStreamsModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsBasicAuthGuard,
    HighCardinalityIndexerService,
    MetricCompactorService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService, HighCardinalityIndexerService, MetricCompactorService],
})
export class MetricsModule {}
