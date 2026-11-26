import { MatchmakingBracketQueueService } from './matchmaking-bracket-queue.service';

describe('MatchmakingBracketQueueService', () => {
  let service: MatchmakingBracketQueueService;
  beforeEach(() => { service = new MatchmakingBracketQueueService(); });
  it('manages matchmaking queue', () => {
    service.enqueue({ id: 'u1', rating: 1500, enqueuedAt: Date.now() });
    expect(service.getQueueSize()).toBe(1);
  });
});
