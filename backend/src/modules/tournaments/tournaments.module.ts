import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { DistributedTransactionCoordinator } from './distributed-transaction.service';
import { LeaderElectionService } from './leader-election.service';
import { LeaderElectionController } from './leader-election.controller';
import { SwissPairingService } from './swiss-pairing.service';
import { TournamentBracketService } from './tournament-bracket.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TournamentController, LeaderElectionController],
  providers: [
    TournamentService,
    DistributedTransactionCoordinator,
    LeaderElectionService,
    SwissPairingService,
    TournamentBracketService,
  ],
  exports: [
    TournamentService,
    DistributedTransactionCoordinator,
    LeaderElectionService,
    SwissPairingService,
    TournamentBracketService,
  ],
})
export class TournamentsModule {}
