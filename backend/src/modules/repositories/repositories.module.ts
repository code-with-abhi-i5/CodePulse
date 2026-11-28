import { Module } from '@nestjs/common';
import { RepositoriesController } from './repositories.controller';
import { RepositoriesService } from './repositories.service';
import { ArchiveStreamService } from './archive-stream.service';
import { ZeroCopyStreamService } from './zero-copy-stream.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DocEvaluatorService } from '../ai/doc-evaluator.service';
import { GitTreeService } from './git-tree.service';
import { QualityScorecardService } from './quality-scorecard.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [RepositoriesController],
  providers: [
    RepositoriesService,
    ArchiveStreamService,
    ZeroCopyStreamService,
    DocEvaluatorService,
    GitTreeService,
    QualityScorecardService,
  ],
  exports: [
    RepositoriesService,
    ArchiveStreamService,
    ZeroCopyStreamService,
    DocEvaluatorService,
    GitTreeService,
    QualityScorecardService,
  ],
})
export class RepositoriesModule {}
