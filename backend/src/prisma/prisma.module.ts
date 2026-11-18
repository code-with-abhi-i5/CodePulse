import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DeadlockDetectorService } from '../common/monitoring/deadlock-detector.service';
import { ReplicaBalancerService } from './replica-balancer.service';

@Global()
@Module({
  providers: [PrismaService, DeadlockDetectorService, ReplicaBalancerService],
  exports: [PrismaService, DeadlockDetectorService, ReplicaBalancerService],
})
export class PrismaModule {}
