/**
 * @file peer-review-swarm-consensus.module.ts
 * @description NestJS module configuring [AI-SWARM-063]: Autonomous Multi-Agent Peer Review Swarm with Verifier-Debater Consensus Protocol.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { PeerReviewSwarmConsensusService } from './peer-review-swarm-consensus.service';
import { PeerReviewSwarmConsensusController } from './peer-review-swarm-consensus.controller';

@Module({
  controllers: [PeerReviewSwarmConsensusController],
  providers: [PeerReviewSwarmConsensusService],
  exports: [PeerReviewSwarmConsensusService],
})
export class PeerReviewSwarmConsensusModule {}
