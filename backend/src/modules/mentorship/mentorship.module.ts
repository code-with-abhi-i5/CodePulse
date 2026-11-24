import { Module } from '@nestjs/common';
import { ShadowCodingService } from './shadow-coding.service';
import { MentorshipController } from './mentorship.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { GraphTraversalService } from './graph-traversal.service';
import { MentorMatcherService } from './mentor-matcher.service';

@Module({
  imports: [PrismaModule],
  controllers: [MentorshipController],
  providers: [ShadowCodingService, GraphTraversalService, MentorMatcherService],
  exports: [ShadowCodingService, GraphTraversalService, MentorMatcherService],
})
export class MentorshipModule {}
