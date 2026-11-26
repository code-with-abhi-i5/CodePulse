import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { CommandBus } from './core/command-bus';
import { QueryBus } from './core/query-bus';
import { EventBus } from './core/event-bus';
import { RecordMatchResultCommand } from './commands/record-match-result.command';
import { RecordMatchResultCommandHandler } from './commands/record-match-result.handler';
import { SyncUserCommitsCommand } from './commands/sync-user-commits.command';
import { SyncUserCommitsCommandHandler } from './commands/sync-user-commits.handler';
import { GetTopDevelopersQuery } from './queries/get-top-developers.query';
import { GetTopDevelopersQueryHandler } from './queries/get-top-developers.handler';
import { GetCountryLeaderboardQuery } from './queries/get-country-leaderboard.query';
import { GetCountryLeaderboardQueryHandler } from './queries/get-country-leaderboard.handler';
import { MatchResultRecordedEvent } from './events/match-result-recorded.event';
import { UserCommitsSyncedEvent } from './events/user-commits-synced.event';
import { MatchResultProjector } from './projectors/match-result.projector';
import { UserCommitsProjector } from './projectors/user-commits.projector';
import { RedisZsetProjectorService } from './projectors/redis-zset-projector.service';
import { LeaderboardReconcilerService } from './reconciler/leaderboard-reconciler.service';
import { LeaderboardsCqrsController } from './leaderboards-cqrs.controller';
import { RedisService } from '../../../common/redis/redis.service';

@Module({
  controllers: [LeaderboardsCqrsController],
  providers: [
    CommandBus,
    QueryBus,
    EventBus,
    RedisZsetProjectorService,
    LeaderboardReconcilerService,
    RedisService,

    // Command Handlers (Postgres write-master)
    RecordMatchResultCommandHandler,
    SyncUserCommitsCommandHandler,

    // Query Handlers (Redis ZSET read model < 5ms)
    GetTopDevelopersQueryHandler,
    GetCountryLeaderboardQueryHandler,

    // Event Projectors (Async state projections to Redis ZSET)
    MatchResultProjector,
    UserCommitsProjector,
  ],
  exports: [
    CommandBus,
    QueryBus,
    EventBus,
    RedisZsetProjectorService,
    LeaderboardReconcilerService,
    RecordMatchResultCommandHandler,
    SyncUserCommitsCommandHandler,
    GetTopDevelopersQueryHandler,
    GetCountryLeaderboardQueryHandler,
    MatchResultProjector,
    UserCommitsProjector,
  ],
})
export class LeaderboardCqrsModule implements OnModuleInit {
  private readonly logger = new Logger(LeaderboardCqrsModule.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly recordMatchHandler: RecordMatchResultCommandHandler,
    private readonly syncCommitsHandler: SyncUserCommitsCommandHandler,
    private readonly getTopDevelopersHandler: GetTopDevelopersQueryHandler,
    private readonly getCountryLeaderboardHandler: GetCountryLeaderboardQueryHandler,
    private readonly matchResultProjector: MatchResultProjector,
    private readonly userCommitsProjector: UserCommitsProjector,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing Leaderboard CQRS Module: Registering handlers...');

    // 1. Register Command Handlers
    this.commandBus.register(RecordMatchResultCommand, this.recordMatchHandler);
    this.commandBus.register(SyncUserCommitsCommand, this.syncCommitsHandler);

    // 2. Register Query Handlers
    this.queryBus.register(GetTopDevelopersQuery, this.getTopDevelopersHandler);
    this.queryBus.register(GetCountryLeaderboardQuery, this.getCountryLeaderboardHandler);

    // 3. Register Event Projectors (Async Read Model)
    this.eventBus.register(MatchResultRecordedEvent, this.matchResultProjector);
    this.eventBus.register(UserCommitsSyncedEvent, this.userCommitsProjector);

    this.logger.log('Leaderboard CQRS Module successfully initialized.');
  }
}
