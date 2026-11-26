import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '../core/cqrs.decorators';
import { IEventHandler } from '../core/cqrs.types';
import { UserCommitsSyncedEvent } from '../events/user-commits-synced.event';
import { RedisZsetProjectorService } from './redis-zset-projector.service';

@Injectable()
@EventsHandler(UserCommitsSyncedEvent)
export class UserCommitsProjector implements IEventHandler<UserCommitsSyncedEvent> {
  private readonly logger = new Logger(UserCommitsProjector.name);

  constructor(private readonly redisProjector: RedisZsetProjectorService) {}

  async handle(event: UserCommitsSyncedEvent): Promise<void> {
    const { userId, totalCommits, newScore, country } = event;

    this.logger.debug(
      `Projecting UserCommitsSyncedEvent into Redis ZSET for user ${userId} (Commits: ${totalCommits}, Score: ${newScore})`,
    );

    const globalCommitsKey = this.redisProjector.getGlobalCommitsKey();
    const globalRatingKey = this.redisProjector.getGlobalRatingKey();

    // 1. Update Global ZSETs
    await Promise.all([
      this.redisProjector.zAdd(globalCommitsKey, totalCommits, userId),
      this.redisProjector.zAdd(globalRatingKey, newScore, userId),
    ]);

    // 2. Update Country ZSETs if country is known
    if (country) {
      const countryCommitsKey = this.redisProjector.getCountryCommitsKey(country);
      const countryRatingKey = this.redisProjector.getCountryRatingKey(country);

      await Promise.all([
        this.redisProjector.zAdd(countryCommitsKey, totalCommits, userId),
        this.redisProjector.zAdd(countryRatingKey, newScore, userId),
        this.redisProjector.setUserMetadata(userId, { country }),
      ]);
    }
  }
}
