import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
