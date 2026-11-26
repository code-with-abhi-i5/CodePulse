import { createHash } from 'crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DisputeRulingAction =
  | 'INVALIDATE_MATCH'
  | 'AWARD_WIN_PLAYER_A'
  | 'AWARD_WIN_PLAYER_B'
  | 'SCHEDULE_REMATCH';

export interface SocketFrameTrace {
  timestampMs: number;
  serverTimestampIso: string;
  source: 'PLAYER_A' | 'PLAYER_B' | 'SERVER';
  eventType: string;
  keystroke?: string;
  codeSnapshot?: string;
  executionOutput?: string;
  latencyMs: number;
}

export interface TimelineSnapshotAtMs {
  timestampMs: number;
  serverTimestampIso: string;
  playerAKeystroke: string;
  playerACodeSnapshot: string;
  playerBKeystroke: string;
  playerBCodeSnapshot: string;
  serverTestOutput: string;
  playerALatencyMs: number;
  playerBLatencyMs: number;
}

export interface AdjudicationAuditEntry {
  auditId: string;
  disputeId: string;
  matchId: string;
  rulingAction: DisputeRulingAction;
  judgeId: string;
  judgeReason: string;
  digitalSignature: string;
  notifiedPlayers: string[];
  decidedAtIso: string;
}

export interface MatchDisputeCase {
  disputeId: string;
  matchId: string;
  playerAId: string;
  playerBId: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  durationMs: number;
  frames: SocketFrameTrace[];
  ruling?: AdjudicationAuditEntry;
}

@Injectable()
export class DisputeAdjudicationService {
  private readonly logger = new Logger(DisputeAdjudicationService.name);
  private readonly disputes = new Map<string, MatchDisputeCase>();
  private readonly immutableAuditLog: AdjudicationAuditEntry[] = [];
  private readonly notificationsSent: Array<{ playerId: string; disputeId: string; message: string }> = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  createDisputeTrace(params: {
    disputeId: string;
    matchId: string;
    playerAId: string;
    playerBId: string;
    reason: string;
    durationMs?: number;
    frames?: SocketFrameTrace[];
  }): MatchDisputeCase {
    const durationMs = params.durationMs ?? 5000;
    const defaultFrames: SocketFrameTrace[] = [
      {
        timestampMs: 0,
        serverTimestampIso: '2026-11-26T10:00:00.000Z',
        source: 'PLAYER_A',
        eventType: 'KEYSTROKE',
        keystroke: 'const x = 1;',
        codeSnapshot: 'function solve() { const x = 1; }',
        latencyMs: 24,
      },
      {
        timestampMs: 0,
        serverTimestampIso: '2026-11-26T10:00:00.000Z',
        source: 'PLAYER_B',
        eventType: 'KEYSTROKE',
        keystroke: 'const y = 2;',
        codeSnapshot: 'function solve() { const y = 2; }',
        latencyMs: 31,
      },
      {
        timestampMs: 1250,
        serverTimestampIso: '2026-11-26T10:00:01.250Z',
        source: 'PLAYER_A',
        eventType: 'KEYSTROKE',
        keystroke: 'return x + y;',
        codeSnapshot: 'function solve() { const x = 1; return x + y; }',
        latencyMs: 118,
      },
      {
        timestampMs: 1250,
        serverTimestampIso: '2026-11-26T10:00:01.250Z',
        source: 'PLAYER_B',
        eventType: 'KEYSTROKE',
        keystroke: 'return y * 10;',
        codeSnapshot: 'function solve() { const y = 2; return y * 10; }',
        latencyMs: 42,
      },
      {
        timestampMs: 2500,
        serverTimestampIso: '2026-11-26T10:00:02.500Z',
        source: 'SERVER',
        eventType: 'TEST_EXECUTION',
        executionOutput: 'Test #1 PASSED (3ms), Test #2 TIMEOUT (2000ms)',
        latencyMs: 28,
      },
      {
        timestampMs: 4800,
        serverTimestampIso: '2026-11-26T10:00:04.800Z',
        source: 'SERVER',
        eventType: 'TEST_EXECUTION',
        executionOutput: 'Final suite: Player A 4/5, Player B 5/5 (contested sabotage frame)',
        latencyMs: 35,
      },
    ];

    const record: MatchDisputeCase = {
      disputeId: params.disputeId,
      matchId: params.matchId,
      playerAId: params.playerAId,
      playerBId: params.playerBId,
      reason: params.reason,
      status: 'OPEN',
      durationMs,
      frames: params.frames && params.frames.length > 0 ? params.frames : defaultFrames,
    };

    this.disputes.set(record.disputeId, record);
    return record;
  }

  getDispute(disputeId: string): MatchDisputeCase | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * Synchronizes Player A/B keystrokes, code snapshots, server test outputs,
   * and network latency at a millisecond-precision scrubber timestamp.
   */
  scrubTimelineAtMs(disputeId: string, timestampMs: number): TimelineSnapshotAtMs {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found`);
    }

    const clampedMs = Math.max(0, Math.min(dispute.durationMs, timestampMs));
    const eligible = dispute.frames
      .filter((f) => f.timestampMs <= clampedMs)
      .sort((a, b) => a.timestampMs - b.timestampMs);

    let playerAKeystroke = '(none)';
    let playerACodeSnapshot = '';
    let playerBKeystroke = '(none)';
    let playerBCodeSnapshot = '';
    let serverTestOutput = 'Awaiting execution frame';
    let playerALatencyMs = 20;
    let playerBLatencyMs = 20;
    let serverTimestampIso = new Date(Date.UTC(2026, 10, 26, 10, 0, 0, clampedMs)).toISOString();

    for (const frame of eligible) {
      serverTimestampIso = frame.serverTimestampIso;
      if (frame.source === 'PLAYER_A') {
        if (frame.keystroke) playerAKeystroke = frame.keystroke;
        if (frame.codeSnapshot) playerACodeSnapshot = frame.codeSnapshot;
        playerALatencyMs = frame.latencyMs;
      } else if (frame.source === 'PLAYER_B') {
        if (frame.keystroke) playerBKeystroke = frame.keystroke;
        if (frame.codeSnapshot) playerBCodeSnapshot = frame.codeSnapshot;
        playerBLatencyMs = frame.latencyMs;
      } else if (frame.source === 'SERVER' && frame.executionOutput) {
        serverTestOutput = frame.executionOutput;
      }
    }

    return {
      timestampMs: clampedMs,
      serverTimestampIso,
      playerAKeystroke,
      playerACodeSnapshot,
      playerBKeystroke,
      playerBCodeSnapshot,
      serverTestOutput,
      playerALatencyMs,
      playerBLatencyMs,
    };
  }

  /**
   * Issues an administrative match override ruling, computes a SHA-256 digital signature,
   * appends an immutable audit log entry, and dispatches player notifications.
   */
  async adjudicateDispute(params: {
    disputeId: string;
    rulingAction: DisputeRulingAction;
    judgeId: string;
    judgeReason: string;
  }): Promise<AdjudicationAuditEntry> {
    const dispute = this.disputes.get(params.disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${params.disputeId} not found`);
    }

    const decidedAtIso = new Date().toISOString();
    const payloadToSign = [
      params.disputeId,
      dispute.matchId,
      params.rulingAction,
      params.judgeId,
      params.judgeReason.trim(),
      decidedAtIso,
    ].join('|');

    const digitalSignature = createHash('sha256').update(payloadToSign).digest('hex');
    const notifiedPlayers = [dispute.playerAId, dispute.playerBId];

    const auditEntry: AdjudicationAuditEntry = {
      auditId: `audit-${params.disputeId}-${this.immutableAuditLog.length + 1}`,
      disputeId: params.disputeId,
      matchId: dispute.matchId,
      rulingAction: params.rulingAction,
      judgeId: params.judgeId,
      judgeReason: params.judgeReason.trim(),
      digitalSignature,
      notifiedPlayers,
      decidedAtIso,
    };

    dispute.status = 'RESOLVED';
    dispute.ruling = auditEntry;
    this.immutableAuditLog.push(Object.freeze({ ...auditEntry }));

    for (const playerId of notifiedPlayers) {
      this.notificationsSent.push({
        playerId,
        disputeId: params.disputeId,
        message: `Match ${dispute.matchId} ruling: ${params.rulingAction} — ${auditEntry.judgeReason}`,
      });
    }

    if (this.prisma && (this.prisma as any).matchDisputeAudit?.create) {
      await (this.prisma as any).matchDisputeAudit.create({
        data: {
          disputeId: auditEntry.disputeId,
          matchId: auditEntry.matchId,
          rulingAction: auditEntry.rulingAction,
          judgeId: auditEntry.judgeId,
          judgeReason: auditEntry.judgeReason,
          digitalSignature: auditEntry.digitalSignature,
          notifiedPlayers: JSON.stringify(auditEntry.notifiedPlayers),
        },
      });
    }

    this.logger.log(
      `Adjudicated dispute ${params.disputeId} with ${params.rulingAction} by ${params.judgeId}`,
    );

    return auditEntry;
  }

  getImmutableAuditLog(): readonly AdjudicationAuditEntry[] {
    return this.immutableAuditLog;
  }

  getDispatchedNotifications() {
    return [...this.notificationsSent];
  }
}
