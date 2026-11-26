import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '../core/cqrs.decorators';
import { IEventHandler } from '../core/cqrs.types';
import { MatchResultRecordedEvent } from '../events/match-result-recorded.event';
import { RedisZsetProjectorService } from './redis-zset-projector.service';

@Injectable()
@EventsHandler(MatchResultRecordedEvent)
export class MatchResultProjector implements IEventHandler<MatchResultRecordedEvent> {
  private readonly logger = new Logger(MatchResultProjector.name);

  constructor(private readonly redisProjector: RedisZsetProjectorService) {}

  async handle(event: MatchResultRecordedEvent): Promise<void> {
    const {
      matchId,
      winnerId,
      loserId,
      winnerNewScore,
      loserNewScore,
      winnerCountry,
      loserCountry,
    } = event;

    this.logger.debug(
      `Projecting MatchResultRecordedEvent into Redis ZSET for match ${matchId} (Winner: ${winnerId} -> ${winnerNewScore}, Loser: ${loserId} -> ${loserNewScore})`,
    );

    const globalRatingKey = this.redisProjector.getGlobalRatingKey();

    // 1. Update Global Rating ZSET
    await Promise.all([
      this.redisProjector.zAdd(globalRatingKey, winnerNewScore, winnerId),
      this.redisProjector.zAdd(globalRatingKey, loserNewScore, loserId),
    ]);

    // 2. Project Country Rating ZSET for Winner
    if (winnerCountry) {
      const countryKey = this.redisProjector.getCountryRatingKey(winnerCountry);
      await this.redisProjector.zAdd(countryKey, winnerNewScore, winnerId);
      await this.redisProjector.setUserMetadata(winnerId, { country: winnerCountry });
    }

    // 3. Project Country Rating ZSET for Loser
    if (loserCountry) {
      const countryKey = this.redisProjector.getCountryRatingKey(loserCountry);
      await this.redisProjector.zAdd(countryKey, loserNewScore, loserId);
      await this.redisProjector.setUserMetadata(loserId, { country: loserCountry });
    }
  }
}
