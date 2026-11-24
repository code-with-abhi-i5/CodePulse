import { CachePreloaderService } from './cache-preloader.service';
import {
  CacheWarmingSubscriberService,
  DomainMutationEvent,
} from './cache-warming-subscriber.service';

describe('CacheWarmingSubscriberService (#1418)', () => {
  let preloader: CachePreloaderService;
  let subscriber: CacheWarmingSubscriberService;

  beforeEach(() => {
    preloader = new CachePreloaderService();
    subscriber = new CacheWarmingSubscriberService(preloader);
  });

  afterEach(() => {
    subscriber.clear();
  });

  it('should proactively warm tournament and challenge roster on TOURNAMENT_PUBLISHED event', async () => {
    const event: DomainMutationEvent = {
      eventId: 'evt-101',
      eventType: 'TOURNAMENT_PUBLISHED',
      aggregateId: 'tourn-999',
      data: {
        title: 'Spring Coding Championship',
        capacity: 10000,
        challenges: ['c1', 'c2', 'c3'],
      },
      timestamp: Date.now(),
    };

    const warmedKeys = await subscriber.handleDomainMutationEvent(event);
    expect(warmedKeys).toContain('cache:tournament:tourn-999:graph');
    expect(warmedKeys).toContain('cache:tournament:tourn-999:challenges');

    // Verify instant cache hit for students accessing tournament
    const cachedTournament = await preloader.get<any>('cache:tournament:tourn-999:graph');
    expect(cachedTournament).not.toBeNull();
    expect(cachedTournament?.title).toBe('Spring Coding Championship');
    expect(cachedTournament?.status).toBe('WARMED');

    const cachedRoster = await preloader.get<any>('cache:tournament:tourn-999:challenges');
    expect(cachedRoster?.challenges).toHaveLength(3);
  });

  it('should pre-warm challenge details and starter templates on CHALLENGE_UPDATED event', async () => {
    const event: DomainMutationEvent = {
      eventId: 'evt-102',
      eventType: 'CHALLENGE_UPDATED',
      aggregateId: 'ch-42',
      data: {
        difficulty: 'HARD',
        points: 500,
        starterTemplates: {
          typescript: 'function solve() {}',
          python: 'def solve(): pass',
        },
      },
      timestamp: Date.now(),
    };

    const warmedKeys = await subscriber.handleDomainMutationEvent(event);
    expect(warmedKeys).toContain('cache:challenge:ch-42:detail');
    expect(warmedKeys).toContain('cache:challenge:ch-42:starter_code');

    const cachedChallenge = await preloader.get<any>('cache:challenge:ch-42:detail');
    expect(cachedChallenge?.points).toBe(500);

    const cachedCode = await preloader.get<any>('cache:challenge:ch-42:starter_code');
    expect(cachedCode?.python).toBe('def solve(): pass');
  });

  it('should pre-warm contest active state on CONTEST_OPENED event', async () => {
    const event: DomainMutationEvent = {
      eventId: 'evt-103',
      eventType: 'CONTEST_OPENED',
      aggregateId: 'contest-summer-26',
      data: {},
      timestamp: Date.now(),
    };

    const warmedKeys = await subscriber.handleDomainMutationEvent(event);
    expect(warmedKeys).toContain('cache:contest:contest-summer-26:active_state');

    const cached = await preloader.get<any>('cache:contest:contest-summer-26:active_state');
    expect(cached?.isOpen).toBe(true);
  });

  it('should track preloading telemetry and hit ratio improvement', async () => {
    await preloader.preloadEntity('cache:test:key', { val: 42 });

    // 2 hits
    await preloader.get('cache:test:key');
    await preloader.get('cache:test:key');

    // 1 miss
    await preloader.get('cache:nonexistent');

    const telemetry = preloader.getTelemetry();
    expect(telemetry.totalKeysWarmed).toBe(1);
    expect(telemetry.totalCacheHits).toBe(2);
    expect(telemetry.totalCacheMisses).toBe(1);
    expect(telemetry.hitRatioPercent).toBe(66.67);
  });
});
