import { Module } from '@nestjs/common';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';
import { XpReconciliationService } from './xp-reconciliation.service';
import { XpVelocityGovernorService } from './xp-velocity-governor.service';
import { XpAnomalyDetectorService } from './xp-anomaly-detector.service';
import { XpClawbackService } from './xp-clawback.service';
import { LevelsModule } from '../levels/levels.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [LevelsModule, PrismaModule],
  controllers: [XpController],
  providers: [
    XpService,
    XpReconciliationService,
    XpVelocityGovernorService,
    XpAnomalyDetectorService,
    XpClawbackService,
  ],
  exports: [
    XpService,
    XpReconciliationService,
    XpVelocityGovernorService,
    XpAnomalyDetectorService,
    XpClawbackService,
  ],
})
export class XpModule {}
