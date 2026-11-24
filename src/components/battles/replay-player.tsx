'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Gauge,
  Swords,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Flame,
  Zap,
  Code2,
  Terminal,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export type ReplayActionType =
  | 'KEYSTROKE_INSERT'
  | 'KEYSTROKE_DELETE'
  | 'CODE_REPLACE'
  | 'CURSOR_MOVE'
  | 'COMPILE_ERROR'
  | 'TEST_EXECUTION'
  | 'SCORE_UPDATE'
  | 'HP_DELTA'
  | 'SABOTAGE_TRIGGER';

export interface ReplayActionDiff {
  seq: number;
  timestamp: number;
  playerId: string;
  type: ReplayActionType;
  payload: {
    text?: string;
    index?: number;
    length?: number;
    code?: string;
    cursorPosition?: number;
    errorMessage?: string;
    testsPassed?: number;
    totalTests?: number;
    score?: number;
    hpDelta?: number;
    sabotageType?: string;
  };
}

export interface PlayerReplayState {
  code: string;
  cursorPosition: number;
  health: number;
  testsPassed: number;
  totalTests: number;
  score: number;
  activeSabotages: string[];
  lastCompileError?: string | null;
}

export interface ReplayKeyframeSnapshot {
  seq: number;
  timestamp: number;
  players: Record<string, PlayerReplayState>;
}

export type TimelineMarkerType =
  | 'COMPILE_ERROR'
  | 'TEST_PASS'
  | 'LEAD_CHANGE'
  | 'CRITICAL_HIT'
  | 'SABOTAGE';

export interface ReplayTimelineMarker {
  seq: number;
  timestamp: number;
  playerId?: string;
  label: string;
  type: TimelineMarkerType;
  metadata?: Record<string, any>;
}

export interface ReplaySessionMetadata {
  battleId: string;
  challengerId: string;
  challengerUsername: string;
  opponentId: string;
  opponentUsername: string;
  durationMs: number;
  startTime: string;
  endTime: string;
  winnerId?: string;
  totalActions: number;
  totalSnapshots: number;
  compressedSizeBytes?: number;
}

export interface BattleReplaySession {
  metadata: ReplaySessionMetadata;
  snapshots: ReplayKeyframeSnapshot[];
  actions: ReplayActionDiff[];
  timelineMarkers: ReplayTimelineMarker[];
}

export interface ReplayPlayerProps {
  session?: BattleReplaySession;
  battleId?: string;
  autoPlay?: boolean;
  className?: string;
}

const SPEED_OPTIONS = [0.5, 1.0, 2.0, 4.0];

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({
  session: initialSession,
  battleId,
  autoPlay = false,
  className = '',
}) => {
  const [session, setSession] = useState<BattleReplaySession | null>(initialSession || null);
  const [loading, setLoading] = useState<boolean>(!initialSession && !!battleId);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [activeTooltip, setActiveTooltip] = useState<ReplayTimelineMarker | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const scrubberContainerRef = useRef<HTMLDivElement>(null);

  // Fetch session from API if battleId is provided and no session prop
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      return;
    }
    if (!battleId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/v1/battles/${battleId}/replay`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: BattleReplaySession) => {
        if (isMounted) {
          setSession(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Fallback demo session if API error
        if (isMounted) {
          setSession(createFallbackDemoSession(battleId));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialSession, battleId]);

  const activeSession = session || createFallbackDemoSession(battleId || 'battle-demo');
  const durationMs = activeSession.metadata.durationMs || 900000;

  // Pure state reducer with snapshot binary search
  const playerStates = useMemo(() => {
    if (!activeSession.snapshots || activeSession.snapshots.length === 0) {
      return {};
    }

    // Binary search closest preceding snapshot
    let low = 0;
    let high = activeSession.snapshots.length - 1;
    let snapshotIdx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (activeSession.snapshots[mid].timestamp <= currentTimeMs) {
        snapshotIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const baseSnapshot = activeSession.snapshots[snapshotIdx];
    const working: Record<string, PlayerReplayState> = JSON.parse(
      JSON.stringify(baseSnapshot.players),
    );

    // Fold deltas forward from snapshot up to currentTimeMs
    for (let i = baseSnapshot.seq; i < activeSession.actions.length; i++) {
      const act = activeSession.actions[i];
      if (act.timestamp > currentTimeMs) break;

      const p = working[act.playerId];
      if (!p) continue;

      switch (act.type) {
        case 'KEYSTROKE_INSERT':
          if (act.payload.text !== undefined) {
            const idx = act.payload.index ?? p.code.length;
            p.code = p.code.slice(0, idx) + act.payload.text + p.code.slice(idx);
            p.cursorPosition = idx + act.payload.text.length;
          }
          break;
        case 'KEYSTROKE_DELETE':
          if (act.payload.length !== undefined) {
            const idx = act.payload.index ?? Math.max(0, p.code.length - act.payload.length);
            p.code = p.code.slice(0, idx) + p.code.slice(idx + act.payload.length);
            p.cursorPosition = idx;
          }
          break;
        case 'CODE_REPLACE':
          if (act.payload.code !== undefined) {
            p.code = act.payload.code;
            p.cursorPosition = p.code.length;
          }
          break;
        case 'CURSOR_MOVE':
          if (act.payload.cursorPosition !== undefined) {
            p.cursorPosition = act.payload.cursorPosition;
          }
          break;
        case 'COMPILE_ERROR':
          p.lastCompileError = act.payload.errorMessage || 'SyntaxError';
          break;
        case 'TEST_EXECUTION':
          p.testsPassed = act.payload.testsPassed ?? p.testsPassed;
          p.totalTests = act.payload.totalTests ?? p.totalTests;
          if (p.testsPassed === p.totalTests && p.totalTests > 0) {
            p.lastCompileError = null;
          }
          break;
        case 'HP_DELTA':
          p.health = Math.max(0, Math.min(100, p.health + (act.payload.hpDelta ?? 0)));
          break;
        case 'SCORE_UPDATE':
          p.score = act.payload.score ?? p.score;
          break;
        case 'SABOTAGE_TRIGGER':
          if (act.payload.sabotageType) {
            p.activeSabotages.push(act.payload.sabotageType);
          }
          break;
      }
    }

    return working;
  }, [activeSession, currentTimeMs]);

  // Playback loop via requestAnimationFrame
  const tickPlayback = useCallback(
    (now: number) => {
      if (lastTickRef.current > 0) {
        const delta = (now - lastTickRef.current) * playbackSpeed;
        setCurrentTimeMs((prev) => {
          const next = prev + delta;
          if (next >= durationMs) {
            setIsPlaying(false);
            return durationMs;
          }
          return next;
        });
      }
      lastTickRef.current = now;
      animationFrameRef.current = requestAnimationFrame(tickPlayback);
    },
    [durationMs, playbackSpeed],
  );

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(tickPlayback);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTickRef.current = 0;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, tickPlayback]);

  const handleSeek = (targetMs: number) => {
    const clamped = Math.max(0, Math.min(durationMs, targetMs));
    setCurrentTimeMs(clamped);
  };

  const handleStep = (stepDeltaMs: number) => {
    handleSeek(currentTimeMs + stepDeltaMs);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTimeMs(0);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberContainerRef.current) return;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(clickRatio * durationMs);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
  };

  const cId = activeSession.metadata.challengerId;
  const oId = activeSession.metadata.opponentId;
  const challengerState = playerStates[cId] || defaultPlayerState();
  const opponentState = playerStates[oId] || defaultPlayerState();

  const progressPercent = Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100));

  const getMarkerBadgeColor = (type: TimelineMarkerType) => {
    switch (type) {
      case 'COMPILE_ERROR':
        return 'bg-amber-500 text-amber-950 border-amber-600';
      case 'TEST_PASS':
        return 'bg-emerald-500 text-emerald-950 border-emerald-600';
      case 'LEAD_CHANGE':
        return 'bg-purple-500 text-purple-950 border-purple-600';
      case 'CRITICAL_HIT':
        return 'bg-rose-500 text-rose-950 border-rose-600';
      case 'SABOTAGE':
        return 'bg-cyan-500 text-cyan-950 border-cyan-600';
    }
  };

  return (
    <div
      className={`flex flex-col w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${className}`}
      data-testid="replay-player"
    >
      {/* Top Header: Match Metadata & Winner */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-200">
                Match Replay: {activeSession.metadata.challengerUsername} vs {activeSession.metadata.opponentUsername}
              </span>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-xs py-0">
                Snapshot Engine
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>{activeSession.snapshots.length} Keyframes (5s)</span>
              <span>•</span>
              <span>{activeSession.actions.length} Diffs</span>
              <span>•</span>
              <span>Total: {formatTime(durationMs)}</span>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        <div className="flex items-center gap-2">
          {activeSession.metadata.winnerId && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                Winner: {activeSession.metadata.winnerId === cId
                  ? activeSession.metadata.challengerUsername
                  : activeSession.metadata.opponentUsername}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrub Bar & Timeline Section */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-col gap-3">
        {/* Timestamp Display */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-indigo-300">{formatTime(currentTimeMs)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTime(durationMs)}</span>
          </div>
          <div className="text-slate-400 text-xs">
            {activeTooltip ? (
              <span className="text-indigo-300 font-sans font-medium">
                {activeTooltip.label} ({formatTime(activeTooltip.timestamp)})
              </span>
            ) : (
              <span>Hover markers to inspect match events</span>
            )}
          </div>
        </div>

        {/* Interactive Scrub Track */}
        <div
          ref={scrubberContainerRef}
          onClick={handleScrubberClick}
          className="relative w-full h-8 flex items-center cursor-pointer select-none group py-2"
          role="slider"
          aria-valuenow={currentTimeMs}
          aria-valuemin={0}
          aria-valuemax={durationMs}
          aria-label="Match timeline scrubber"
          data-testid="replay-scrubber-track"
        >
          {/* Background rail */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Timeline Markers */}
          {activeSession.timelineMarkers.map((marker, idx) => {
            const markerPos = Math.min(100, Math.max(0, (marker.timestamp / durationMs) * 100));
            return (
              <button
                key={`${marker.seq}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(marker.timestamp);
                }}
                onMouseEnter={() => setActiveTooltip(marker)}
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ left: `${markerPos}%` }}
                aria-label={marker.label}
                data-testid={`marker-${marker.type.toLowerCase()}`}
                className={`absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full border shadow-md transition-transform hover:scale-150 focus:outline-none ${getMarkerBadgeColor(
                  marker.type,
                )}`}
              />
            );
          })}

          {/* Scrubber Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-indigo-600 pointer-events-none group-hover:scale-125 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Controls Bar: Play, Speed, Steps */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 px-2.5 bg-slate-800/80 border-slate-700 hover:bg-slate-750 text-slate-200"
              title="Reset to 00:00"
              data-testid="replay-reset-button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStep(-5000)}
              className="h-8 px-2.5 bg-slate-800/80 border-slate-700 hover:bg-slate-750 text-slate-200"
              title="Step Back 5s"
              data-testid="replay-step-back-button"
            >
              <SkipBack className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">-5s</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`h-8 px-4 font-semibold text-xs ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
              data-testid="replay-play-pause-button"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Play
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStep(5000)}
              className="h-8 px-2.5 bg-slate-800/80 border-slate-700 hover:bg-slate-750 text-slate-200"
              title="Step Forward 5s"
              data-testid="replay-step-forward-button"
            >
              <span className="text-xs">+5s</span>
              <SkipForward className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* Speed Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <Gauge className="w-3.5 h-3.5 text-slate-400 mx-1.5" />
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                data-testid={`speed-${speed}x`}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual-Coder Parallel Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-[420px]">
        {/* Challenger Pane */}
        <PlayerReplayPane
          username={activeSession.metadata.challengerUsername}
          isWinner={activeSession.metadata.winnerId === cId}
          playerState={challengerState}
          side="challenger"
        />

        {/* Opponent Pane */}
        <PlayerReplayPane
          username={activeSession.metadata.opponentUsername}
          isWinner={activeSession.metadata.winnerId === oId}
          playerState={opponentState}
          side="opponent"
        />
      </div>

      {/* Active Timeline Event Indicators legend */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Timeline Highlights:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Compile Error
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Test Passed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Lead Change
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Critical Hit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Sabotage
          </span>
        </div>
      </div>
    </div>
  );
};

interface PlayerReplayPaneProps {
  username: string;
  isWinner: boolean;
  playerState: PlayerReplayState;
  side: 'challenger' | 'opponent';
}

const PlayerReplayPane: React.FC<PlayerReplayPaneProps> = ({
  username,
  isWinner,
  playerState,
  side,
}) => {
  const codeLines = (playerState.code || '').split('\n');

  return (
    <div
      className="flex flex-col bg-slate-950 p-4 gap-3 overflow-hidden"
      data-testid={`player-pane-${side}`}
    >
      {/* Pane Header: Player info, Score, HP, Tests */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 text-sm">{username}</span>
          {isWinner && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] py-0">
              VICTORY
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Score:</span>
            <span className="font-mono font-bold text-amber-400">{playerState.score}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-400">
              {playerState.testsPassed}/{playerState.totalTests}
            </span>
          </div>
        </div>
      </div>

      {/* Health Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400 font-medium">Health</span>
          <span
            className={`font-mono font-bold ${
              playerState.health <= 25 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {playerState.health}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-150 ${
              playerState.health <= 25
                ? 'bg-rose-500'
                : playerState.health <= 50
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${playerState.health}%` }}
          />
        </div>
      </div>

      {/* Active Sabotages Tags */}
      {playerState.activeSabotages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
          <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3" /> Sabotages:
          </span>
          {playerState.activeSabotages.map((sab, sIdx) => (
            <Badge
              key={`${sab}-${sIdx}`}
              variant="outline"
              className="text-[10px] bg-cyan-950/40 border-cyan-800 text-cyan-300 py-0"
            >
              {sab}
            </Badge>
          ))}
        </div>
      )}

      {/* Code Viewer Panel with Line Numbers & Cursor */}
      <div className="flex-1 bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden flex flex-col min-h-[260px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-850 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>solution.ts</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Cursor: pos {playerState.cursorPosition}
          </span>
        </div>

        <div className="flex-1 p-3 font-mono text-xs overflow-auto text-slate-200 leading-relaxed whitespace-pre selection:bg-indigo-600/30">
          {codeLines.map((line, idx) => (
            <div key={idx} className="flex gap-3 hover:bg-slate-800/40 px-1 rounded">
              <span className="text-slate-600 select-none w-6 text-right font-mono text-[11px]">
                {idx + 1}
              </span>
              <span className="flex-1">
                {line || ' '}
                {idx === codeLines.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse align-middle ml-0.5" />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Compile Error Callout */}
        {playerState.lastCompileError && (
          <div className="p-2.5 bg-amber-950/50 border-t border-amber-900/60 flex items-start gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold text-amber-300">Compilation Error</span>
              <span className="font-mono text-[11px] text-amber-200/90">
                {playerState.lastCompileError}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function defaultPlayerState(): PlayerReplayState {
  return {
    code: '',
    cursorPosition: 0,
    health: 100,
    testsPassed: 0,
    totalTests: 0,
    score: 0,
    activeSabotages: [],
    lastCompileError: null,
  };
}

function createFallbackDemoSession(battleId: string): BattleReplaySession {
  return {
    metadata: {
      battleId,
      challengerId: 'c1',
      challengerUsername: 'Alice_Dev',
      opponentId: 'o2',
      opponentUsername: 'Bob_Code',
      durationMs: 900000,
      startTime: new Date(Date.now() - 900000).toISOString(),
      endTime: new Date().toISOString(),
      winnerId: 'c1',
      totalActions: 45,
      totalSnapshots: 10,
    },
    snapshots: [
      {
        seq: 0,
        timestamp: 0,
        players: {
          c1: {
            code: 'function solve(input) {\n',
            cursorPosition: 24,
            health: 100,
            testsPassed: 0,
            totalTests: 5,
            score: 0,
            activeSabotages: [],
          },
          o2: {
            code: 'function solve(input) {\n',
            cursorPosition: 24,
            health: 100,
            testsPassed: 0,
            totalTests: 5,
            score: 0,
            activeSabotages: [],
          },
        },
      },
    ],
    actions: [
      {
        seq: 1,
        timestamp: 45000,
        playerId: 'c1',
        type: 'COMPILE_ERROR',
        payload: { errorMessage: 'SyntaxError: Unexpected token' },
      },
      {
        seq: 2,
        timestamp: 90000,
        playerId: 'o2',
        type: 'TEST_EXECUTION',
        payload: { testsPassed: 2, totalTests: 5 },
      },
      {
        seq: 3,
        timestamp: 92000,
        playerId: 'o2',
        type: 'SCORE_UPDATE',
        payload: { score: 100 },
      },
      {
        seq: 4,
        timestamp: 150000,
        playerId: 'o2',
        type: 'SABOTAGE_TRIGGER',
        payload: { sabotageType: 'VIM_LOCK' },
      },
      {
        seq: 5,
        timestamp: 210000,
        playerId: 'c1',
        type: 'SCORE_UPDATE',
        payload: { score: 180 },
      },
      {
        seq: 6,
        timestamp: 300000,
        playerId: 'o2',
        type: 'HP_DELTA',
        payload: { hpDelta: -30 },
      },
      {
        seq: 7,
        timestamp: 820000,
        playerId: 'c1',
        type: 'TEST_EXECUTION',
        payload: { testsPassed: 5, totalTests: 5 },
      },
    ],
    timelineMarkers: [
      {
        seq: 1,
        timestamp: 45000,
        playerId: 'c1',
        label: 'First Compile Error (Alice_Dev)',
        type: 'COMPILE_ERROR',
      },
      {
        seq: 2,
        timestamp: 90000,
        playerId: 'o2',
        label: 'Test Passed (Bob_Code): 2/5',
        type: 'TEST_PASS',
      },
      {
        seq: 4,
        timestamp: 150000,
        playerId: 'o2',
        label: 'Sabotage Deployed: VIM_LOCK',
        type: 'SABOTAGE',
      },
      {
        seq: 5,
        timestamp: 210000,
        playerId: 'c1',
        label: 'Lead Change: Alice_Dev takes lead',
        type: 'LEAD_CHANGE',
      },
      {
        seq: 6,
        timestamp: 300000,
        playerId: 'o2',
        label: 'Critical Hit on Bob_Code (-30 HP)',
        type: 'CRITICAL_HIT',
      },
      {
        seq: 7,
        timestamp: 820000,
        playerId: 'c1',
        label: 'All Tests Passed (Alice_Dev): 5/5',
        type: 'TEST_PASS',
      },
    ],
  };
}

