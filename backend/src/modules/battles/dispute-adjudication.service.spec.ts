import { DisputeAdjudicationService } from './dispute-adjudication.service';

describe('DisputeAdjudicationService (Audit Traces, ms Timeline Scrubbing, Rulings & Audit Log)', () => {
  let service: DisputeAdjudicationService;

  beforeEach(() => {
    service = new DisputeAdjudicationService();
  });

  it('stores audit traces, synchronizes timeline at millisecond resolution, and records signed rulings', async () => {
    service.createDisputeTrace({
      disputeId: 'disp-596',
      matchId: 'match-final-01',
      playerAId: 'player-a',
      playerBId: 'player-b',
      reason: 'Contested execution timeout at 1250ms',
      durationMs: 5000,
    });

    const snap = service.scrubTimelineAtMs('disp-596', 1250);
    expect(snap.timestampMs).toBe(1250);
    expect(snap.playerAKeystroke).toBe('return x + y;');
    expect(snap.playerBKeystroke).toBe('return y * 10;');
    expect(snap.playerALatencyMs).toBe(118);

    const ruling = await service.adjudicateDispute({
      disputeId: 'disp-596',
      rulingAction: 'SCHEDULE_REMATCH',
      judgeId: 'judge-admin-1',
      judgeReason: 'Verified transient runner spike during finals frame.',
    });

    expect(ruling.rulingAction).toBe('SCHEDULE_REMATCH');
    expect(ruling.digitalSignature).toHaveLength(64);
    expect(ruling.notifiedPlayers).toEqual(['player-a', 'player-b']);
    expect(service.getImmutableAuditLog()).toHaveLength(1);
    expect(service.getDispatchedNotifications()).toHaveLength(2);
  });
});
