import { Module } from '@nestjs/common';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';
import { XpReconciliationService } from './xp-reconciliation.service';
import { LevelsModule } from '../levels/levels.module';

@Module({
  imports: [LevelsModule],
  controllers: [XpController],
  providers: [XpService, XpReconciliationService],
  exports: [XpService, XpReconciliationService],
})
export class XpModule {}
