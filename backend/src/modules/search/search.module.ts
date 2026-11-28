import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisService } from '../../common/redis/redis.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { RagCodeSearchService } from './rag-code-search.service';
import { VectorSearchService } from './vector-search.service';
import { IntentDecomposerService } from './intent-decomposer.service';

@Module({
  imports: [SecurityModule, PrismaModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    RagCodeSearchService,
    VectorSearchService,
    RedisService,
    IntentDecomposerService,
  ],
  exports: [
    SearchService,
    RagCodeSearchService,
    VectorSearchService,
    RedisService,
    IntentDecomposerService,
  ],
})
export class SearchModule {}
