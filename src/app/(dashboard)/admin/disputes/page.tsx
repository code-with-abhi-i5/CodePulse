"use client";

import React, { useMemo, useState } from "react";
import { Pause, Play, Gavel, ShieldCheck, Activity } from "lucide-react";

export type OverrideRuling =
  | "INVALIDATE_MATCH"
  | "AWARD_WIN_PLAYER_A"
  | "AWARD_WIN_PLAYER_B"
  | "SCHEDULE_REMATCH";

export interface TelemetryFrame {
  timestampMs: number;
  playerAKeystroke: string;
  playerACode: string;
  playerBKeystroke: string;
  playerBCode: string;
  serverOutput: string;
  latencyAMs: number;
  latencyBMs: number;
}

export const DEFAULT_DISPUTE_FRAMES: TelemetryFrame[] = [
  {
    timestampMs: 0,
    playerAKeystroke: "let ans = 0;",
    playerACode: "function run(a) { let ans = 0; return ans; }",
    playerBKeystroke: "let sum = 0;",
    playerBCode: "function run(a) { let sum = 0; return sum; }",
    serverOutput: "Match start synced (t=0ms)",
    latencyAMs: 22,
    latencyBMs: 28,
  },
  {
    timestampMs: 1500,
    playerAKeystroke: "for (const n of a) ans += n;",
    playerACode: "function run(a) { let ans = 0; for (const n of a) ans += n; return ans; }",
    playerBKeystroke: "return a.reduce((x,y)=>x+y,0);",
    playerBCode: "function run(a) { return a.reduce((x,y)=>x+y,0); }",
    serverOutput: "Sample batch 1/3 passed on both clients",
    latencyAMs: 145,
    latencyBMs: 34,
  },
  {
    timestampMs: 3500,
    playerAKeystroke: "// sabotage pulse check",
    playerACode: "function run(a) { let ans = 0; for (const n of a) ans += n; return ans; }",
    playerBKeystroke: "if (!a) return 0;",
    playerBCode: "function run(a) { if (!a) return 0; return a.reduce((x,y)=>x+y,0); }",
    serverOutput: "Compiler runner timeout reported on Player A frame",
    latencyAMs: 210,
    latencyBMs: 39,
  },
];

export interface AdminDisputeDashboardProps {
  disputeId?: string;
  matchId?: string;
  frames?: TelemetryFrame[];
}

export const AdminDisputeDashboard: React.FC<AdminDisputeDashboardProps> = ({
  disputeId = "disp-finals-596",
  matchId = "match-semi-01",
  frames = DEFAULT_DISPUTE_FRAMES,
}) => {
  const maxMs = frames[frames.length - 1]?.timestampMs ?? 3500;
  const [timestampMs, setTimestampMs] = useState<number>(1500);
  const [paused, setPaused] = useState<boolean>(true);
  const [judgeReason, setJudgeReason] = useState<string>(
    "Verified network jitter spike on Player A at 3500ms during finals evaluation.",
  );
  const [activeRuling, setActiveRuling] = useState<string | null>(null);

  const currentFrame = useMemo(() => {
    let chosen = frames[0];
    for (const f of frames) {
      if (f.timestampMs <= timestampMs) {
        chosen = f;
      }
    }
    return chosen;
  }, [frames, timestampMs]);

  const applyRuling = (ruling: OverrideRuling) => {
    setPaused(true);
    setActiveRuling(`${ruling} (${judgeReason})`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Admin Match Dispute Adjudication — {disputeId}
            </h1>
            <p className="text-xs text-zinc-400">
              Match: <span className="font-mono text-cyan-400">{matchId}</span> · Millisecond Timeline & Multi-Angle Snapshot Inspector
            </p>
          </div>

          <button
            type="button"
            data-testid="toggle-pause-btn"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            {paused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
            {paused ? "Paused" : "Playing"}
          </button>
        </div>

        {/* Millisecond-Precision Timeline Scrubber */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span data-testid="scrubber-timestamp-ms" className="text-cyan-300">
              Timeline: {timestampMs} ms
            </span>
            <span className="text-zinc-400">
              Latency A: {currentFrame.latencyAMs}ms · Latency B: {currentFrame.latencyBMs}ms
            </span>
          </div>
          <input
            type="range"
            data-testid="timeline-scrubber"
            min={0}
            max={maxMs}
            step={50}
            value={timestampMs}
            onChange={(e) => setTimestampMs(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Synchronized Player A / Player B Snapshots & Server Output */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <div className="text-xs font-bold uppercase text-indigo-400">Player A Snapshot</div>
            <div data-testid="player-a-keystroke" className="font-mono text-xs text-zinc-200">
              Keystroke: {currentFrame.playerAKeystroke}
            </div>
            <pre data-testid="player-a-code" className="overflow-x-auto rounded-lg bg-zinc-950 p-2.5 text-[11px] text-zinc-300">
              {currentFrame.playerACode}
            </pre>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <div className="text-xs font-bold uppercase text-emerald-400">Player B Snapshot</div>
            <div data-testid="player-b-keystroke" className="font-mono text-xs text-zinc-200">
              Keystroke: {currentFrame.playerBKeystroke}
            </div>
            <pre data-testid="player-b-code" className="overflow-x-auto rounded-lg bg-zinc-950 p-2.5 text-[11px] text-zinc-300">
              {currentFrame.playerBCode}
            </pre>
          </div>
        </div>

        <div
          data-testid="server-test-output"
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-xs text-amber-200"
        >
          <Activity className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Server Test Output: {currentFrame.serverOutput}</span>
        </div>

        {/* Administrative Match Override Actions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
            <Gavel className="h-4 w-4 text-rose-400" />
            <span>Administrative Match Override Rulings</span>
          </div>

          <input
            type="text"
            data-testid="judge-reason-input"
            value={judgeReason}
            onChange={(e) => setJudgeReason(e.target.value)}
            placeholder="Enter formal judge reason..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white"
          />

          <div className="flex flex-wrap gap-2">
            {(
              [
                "INVALIDATE_MATCH",
                "AWARD_WIN_PLAYER_A",
                "AWARD_WIN_PLAYER_B",
                "SCHEDULE_REMATCH",
              ] as OverrideRuling[]
            ).map((action) => (
              <button
                key={action}
                type="button"
                data-testid={`ruling-${action}`}
                onClick={() => applyRuling(action)}
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25"
              >
                {action}
              </button>
            ))}
          </div>

          {activeRuling && (
            <div
              data-testid="adjudication-ruling-banner"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Recorded Ruling: {activeRuling}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeDashboard;
