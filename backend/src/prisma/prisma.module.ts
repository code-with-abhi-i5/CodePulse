import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ReplicaBalancerService } from './replica-balancer.service';

@Global()
@Module({
  providers: [PrismaService, ReplicaBalancerService],
  exports: [PrismaService, ReplicaBalancerService],
})
export class PrismaModule {}
