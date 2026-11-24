import { Test, TestingModule } from '@nestjs/testing';
import { ReplayEngineService, BattleReplaySession } from './replay-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ReplayEngineService', () => {
  let service: ReplayEngineService;
  const storageDir = path.resolve(process.cwd(), 'data', 'replays');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayEngineService,
        {
          provide: PrismaService,
          useValue: {
            battle: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'battle-test-123',
                challengerId: 'alice',
                challenger: { username: 'Alice' },
                opponentId: 'bob',
                opponent: { username: 'Bob' },
                winnerId: 'alice',
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReplayEngineService>(ReplayEngineService);
  });

  afterAll(() => {
    // Clean up test replay file if created
    const testFile = path.join(storageDir, 'battle-test-123.replay.gz');
    if (fs.existsSync(testFile)) {
      try {
        fs.unlinkSync(testFile);
      } catch {}
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Session Lifecycle & Snapshot Recording', () => {
    it('should initialize a session with origin snapshot at t=0', () => {
      const session = service.createSession({
        battleId: 'battle-01',
        challengerId: 'player1',
        challengerUsername: 'Player One',
        opponentId: 'player2',
        opponentUsername: 'Player Two',
        durationMs: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      expect(session.snapshots.length).toBe(1);
      expect(session.snapshots[0].seq).toBe(0);
      expect(session.snapshots[0].timestamp).toBe(0);
      expect(session.snapshots[0].players['player1'].health).toBe(100);
      expect(session.snapshots[0].players['player2'].health).toBe(100);
    });

    it('should capture keyframe snapshots every 5000ms', () => {
      service.createSession({
        battleId: 'battle-02',
        challengerId: 'p1',
        challengerUsername: 'P1',
        opponentId: 'p2',
        opponentUsername: 'P2',
        durationMs: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      // Action at 1000ms -> should not trigger new snapshot
      service.recordAction('battle-02', {
        timestamp: 1000,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: 'a' },
      });

      // Action at 4999ms -> still within 5000ms interval
      service.recordAction('battle-02', {
        timestamp: 4999,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: 'b' },
      });

      let replay = service.seekState(
        service['activeSessions'].get('battle-02')!,
        4999,
      );
      expect(service['activeSessions'].get('battle-02')!.snapshots.length).toBe(1);

      // Action at 5000ms -> triggers second snapshot
      service.recordAction('battle-02', {
        timestamp: 5000,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: 'c' },
      });

      const session = service['activeSessions'].get('battle-02')!;
      expect(session.snapshots.length).toBe(2);
      expect(session.snapshots[1].timestamp).toBe(5000);
      expect(session.snapshots[1].players['p1'].code).toBe('abc');

      // Action at 10500ms -> triggers third snapshot
      service.recordAction('battle-02', {
        timestamp: 10500,
        playerId: 'p2',
        type: 'KEYSTROKE_INSERT',
        payload: { text: 'xyz' },
      });

      expect(session.snapshots.length).toBe(3);
      expect(session.snapshots[2].timestamp).toBe(10500);
    });
  });

  describe('Seeking and Time-Travel Engine', () => {
    it('should seek to any timestamp in sub-16ms and accurately reconstruct code and cursor', () => {
      const session = service.createSession({
        battleId: 'battle-seek',
        challengerId: 'p1',
        challengerUsername: 'P1',
        opponentId: 'p2',
        opponentUsername: 'P2',
        durationMs: 20000,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      service.recordAction('battle-seek', {
        timestamp: 2000,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: 'function solve() {\n' },
      });

      service.recordAction('battle-seek', {
        timestamp: 6000,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: '  return 42;\n' },
      });

      service.recordAction('battle-seek', {
        timestamp: 12000,
        playerId: 'p1',
        type: 'KEYSTROKE_INSERT',
        payload: { text: '}\n' },
      });

      // Seek before 2000ms
      const seek1 = service.seekState(session, 1000);
      expect(seek1.state['p1'].code).toBe('');
      expect(seek1.seekTimeMs).toBeLessThan(16);

      // Seek at 7000ms (after second edit, before third)
      const seek2 = service.seekState(session, 7000);
      expect(seek2.state['p1'].code).toBe('function solve() {\n  return 42;\n');
      expect(seek2.seekTimeMs).toBeLessThan(16);

      // Seek at 15000ms (all edits folded)
      const seek3 = service.seekState(session, 15000);
      expect(seek3.state['p1'].code).toBe('function solve() {\n  return 42;\n}\n');
      expect(seek3.seekTimeMs).toBeLessThan(16);
    });
  });

  describe('Key Moments Timeline Markers', () => {
    it('should detect compile error, test passes, lead changes, sabotages, and critical hits', () => {
      const session = service.createSession({
        battleId: 'battle-markers',
        challengerId: 'alice',
        challengerUsername: 'Alice',
        opponentId: 'bob',
        opponentUsername: 'Bob',
        durationMs: 60000,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      // 1. First compile error
      service.recordAction('battle-markers', {
        timestamp: 3000,
        playerId: 'alice',
        type: 'COMPILE_ERROR',
        payload: { errorMessage: 'SyntaxError: Unexpected token' },
      });

      // 2. Score update -> Bob leads
      service.recordAction('battle-markers', {
        timestamp: 8000,
        playerId: 'bob',
        type: 'SCORE_UPDATE',
        payload: { score: 100 },
      });

      // 3. Score update -> Alice overtakes Bob (Lead change)
      service.recordAction('battle-markers', {
        timestamp: 15000,
        playerId: 'alice',
        type: 'SCORE_UPDATE',
        payload: { score: 150 },
      });

      // 4. Sabotage triggered
      service.recordAction('battle-markers', {
        timestamp: 20000,
        playerId: 'alice',
        type: 'SABOTAGE_TRIGGER',
        payload: { sabotageType: 'VIM_MODE' },
      });

      // 5. Critical hit
      service.recordAction('battle-markers', {
        timestamp: 25000,
        playerId: 'bob',
        type: 'HP_DELTA',
        payload: { hpDelta: -35 },
      });

      // 6. Test execution passed
      service.recordAction('battle-markers', {
        timestamp: 30000,
        playerId: 'alice',
        type: 'TEST_EXECUTION',
        payload: { testsPassed: 5, totalTests: 5 },
      });

      const markers = session.timelineMarkers;
      expect(markers.some((m) => m.type === 'COMPILE_ERROR')).toBe(true);
      expect(markers.some((m) => m.type === 'LEAD_CHANGE')).toBe(true);
      expect(markers.some((m) => m.type === 'SABOTAGE')).toBe(true);
      expect(markers.some((m) => m.type === 'CRITICAL_HIT')).toBe(true);
      expect(markers.some((m) => m.type === 'TEST_PASS')).toBe(true);
    });
  });

  describe('Compression & Size Optimization (< 2MB)', () => {
    it('should compress a 15-minute high intensity battle well under 2MB', async () => {
      const synthetic = service.generateSynthetic15MinReplay({
        battleId: 'battle-15m',
        challengerId: 'alice',
        challengerUsername: 'Alice',
        opponentId: 'bob',
        opponentUsername: 'Bob',
      });

      expect(synthetic.metadata.durationMs).toBe(900000);
      expect(synthetic.snapshots.length).toBeGreaterThanOrEqual(180);
      expect(synthetic.actions.length).toBeGreaterThan(300);

      const compressed = service.compressSession(synthetic);
      const decompressed = service.decompressSession(compressed);

      // Verify strict size requirement: under 2MB (2,097,152 bytes)
      expect(compressed.byteLength).toBeLessThan(2 * 1024 * 1024);
      expect(decompressed.actions.length).toBe(synthetic.actions.length);
      expect(decompressed.snapshots.length).toBe(synthetic.snapshots.length);
      expect(decompressed.metadata.battleId).toBe('battle-15m');
    });

    it('should save and load replay file from disk', async () => {
      const session = service.generateSynthetic15MinReplay({
        battleId: 'battle-test-123',
        challengerId: 'alice',
        challengerUsername: 'Alice',
        opponentId: 'bob',
        opponentUsername: 'Bob',
      });

      const filePath = await service.saveReplay('battle-test-123', session);
      expect(fs.existsSync(filePath)).toBe(true);

      const loaded = await service.getReplay('battle-test-123');
      expect(loaded.metadata.battleId).toBe('battle-test-123');
      expect(loaded.actions.length).toBe(session.actions.length);
    });
  });
});

