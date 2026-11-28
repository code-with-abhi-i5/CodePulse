import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { DataRetentionReaperService } from './data-retention-reaper.service';
import { SecurityModule } from '../security/security.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [SecurityModule, StorageModule, AuthModule, AnalyticsModule],
  controllers: [AdminController],
  providers: [AdminService, AuditLogService, DataRetentionReaperService],
  exports: [AdminService, AuditLogService, DataRetentionReaperService],
})
export class AdminModule {}
