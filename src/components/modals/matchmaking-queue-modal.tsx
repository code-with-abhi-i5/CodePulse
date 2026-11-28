"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Swords,
  X,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MatchmakingMode = "1v1-ranked" | "casual-blitz" | "algo-duel" | "team-clash";

export type MatchmakingStatus = "searching" | "found" | "ready" | "cancelled" | "timeout";

export interface MatchmakingPlayer {
  readonly id: string;
  readonly username: string;
  readonly name?: string;
  readonly avatarUrl?: string;
  readonly eloRating: number;
  readonly tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GRANDMASTER";
  readonly winRate?: number;
  readonly primaryLanguage?: string;
}

export interface MatchmakingQueueModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentUser?: MatchmakingPlayer;
  readonly mode?: MatchmakingMode;
  readonly targetLanguage?: string;
  readonly onMatchFound?: (opponent: MatchmakingPlayer) => void;
  readonly onAcceptMatch?: (matchId: string) => void;
  readonly onCancelQueue?: () => void;
  readonly simulatedWaitSeconds?: number;
}

const DEFAULT_CURRENT_USER: MatchmakingPlayer = {
  id: "user-curr-1",
  username: "codepulse_dev",
  name: "Current Challenger",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
  eloRating: 1850,
  tier: "DIAMOND",
  winRate: 68.5,
  primaryLanguage: "TypeScript",
};

const DEFAULT_OPPONENT: MatchmakingPlayer = {
  id: "user-opp-99",
  username: "alexrivera_99",
  name: "Alex Rivera",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  eloRating: 1865,
  tier: "DIAMOND",
  winRate: 67.2,
  primaryLanguage: "TypeScript",
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MatchmakingQueueModal({
  isOpen,
  onClose,
  currentUser = DEFAULT_CURRENT_USER,
  mode = "1v1-ranked",
  targetLanguage = "TypeScript",
  onMatchFound,
  onAcceptMatch,
  onCancelQueue,
  simulatedWaitSeconds = 6,
}: MatchmakingQueueModalProps) {
  const [status, setStatus] = useState<MatchmakingStatus>("searching");
  const [elapsed, setElapsed] = useState<number>(0);
  const [opponent, setOpponent] = useState<MatchmakingPlayer | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Close handler with callback notification
  const handleClose = useCallback(() => {
    if (status === "searching" && onCancelQueue) {
      onCancelQueue();
    }
    onClose();
  }, [status, onCancelQueue, onClose]);

  // Reset internal states upon modal opening/closing
  useEffect(() => {
    if (isOpen) {
      setStatus("searching");
      setElapsed(0);
      setOpponent(null);
      setCountdown(5);
    }
  }, [isOpen]);

  // Elapsed timer & automated simulation during search
  useEffect(() => {
    if (!isOpen || status !== "searching") return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= simulatedWaitSeconds && simulatedWaitSeconds > 0) {
          setStatus("found");
          setOpponent(DEFAULT_OPPONENT);
          if (onMatchFound) {
            onMatchFound(DEFAULT_OPPONENT);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, status, simulatedWaitSeconds, onMatchFound]);

  // Match confirmation countdown
  useEffect(() => {
    if (!isOpen || status !== "found") return;

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setStatus("ready");
          if (onAcceptMatch) {
            onAcceptMatch("match_sim_8921");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isOpen, status, onAcceptMatch]);

  // ==========================================================================
  // Strict Keyboard Focus Trap Engine
  // ==========================================================================
  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture previously focused element to restore upon close
    if (typeof document !== "undefined") {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    // 2. Initial focus: focus the first interactive element inside the modal
    const focusInitialElement = () => {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        modalRef.current.focus();
      }
    };

    const animFrame = requestAnimationFrame(focusInitialElement);

    // 3. Strict Keyboard Trap Listener: Tab, Shift+Tab, and Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;

        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

        if (focusable.length === 0) {
          e.preventDefault();
          modalRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          // Shift + Tab: reverse cycling
          if (active === first || !modalRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: forward cycling
          if (active === last || !modalRef.current.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("keydown", handleKeyDown, true);

      // 4. Restore focus on cleanup
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function"
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, handleClose]);

  if (!isOpen) {
    return null;
  }

  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog with Strict Keyboard Focus Trap */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="matchmaking-dialog-title"
        aria-describedby="matchmaking-dialog-desc"
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl",
          "rounded-3xl border shadow-2xl overflow-hidden text-left outline-none",
          "transition-all duration-200 animate-in fade-in zoom-in-95",
          // Light & Dark theme compatibility
          "bg-white dark:bg-slate-950",
          "border-slate-200 dark:border-white/10",
          "text-slate-900 dark:text-slate-50",
          "p-6 sm:p-8"
        )}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Swords className={cn("w-6 h-6", status === "searching" && "animate-pulse")} />
            </div>
            <div>
              <h2
                id="matchmaking-dialog-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {status === "searching" && "Competitive Matchmaking Queue"}
                {status === "found" && "Head-to-Head Opponent Found!"}
                {status === "ready" && "Arena Launching!"}
                {status === "cancelled" && "Matchmaking Cancelled"}
              </h2>
              <p
                id="matchmaking-dialog-desc"
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5"
              >
                {status === "searching" && "Scanning live battle lobbies for developers with comparable ELO ratings."}
                {status === "found" && "Opponent confirmed. Synchronizing challenge arena specifications..."}
                {status === "ready" && "Launching code battlefield in 3 seconds."}
                {status === "cancelled" && "You left the matchmaking queue."}
              </p>
            </div>
          </div>

          {/* Close button with high-visibility focus ring */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close matchmaking queue modal"
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              "hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            )}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Live Status Announcer (Screen Reader Accessibility) */}
        <div aria-live="polite" className="sr-only">
          {status === "searching" && `Matchmaking in progress. Elapsed time: ${minutes} minutes and ${seconds} seconds.`}
          {status === "found" && `Opponent found: ${opponent?.name || opponent?.username}. Ready in ${countdown} seconds.`}
          {status === "ready" && "Match accepted. Connecting to battle arena."}
        </div>

        {/* Modal Body / Status Content */}
        <div className="py-6 flex flex-col items-center justify-center space-y-6">
          {status === "searching" && (
            <>
              {/* Radar pulse visualization */}
              <div className="relative flex items-center justify-center w-28 h-28 my-2">
                <div className="absolute inset-0 rounded-full border-2 border-rose-500/20 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full border-2 border-rose-500/40 animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-rose-500" />
                </div>
              </div>

              {/* Timer & Queue Estimates */}
              <div className="text-center space-y-1">
                <div
                  className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight"
                  aria-label={`Elapsed queue time: ${minutes}:${seconds}`}
                >
                  {minutes}:{seconds}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Average wait time: ~12s • Bracket: ±100 ELO</span>
                </div>
              </div>

              {/* Current Player Status Card */}
              <div className="w-full rounded-2xl p-4 border bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{currentUser.name || currentUser.username}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {currentUser.tier}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Rating: {currentUser.eloRating} ELO • {targetLanguage}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Live Queue</span>
                </div>
              </div>
            </>
          )}

          {status === "found" && opponent && (
            <div className="w-full space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5" />
                <span>Opponent Locked • Auto-starting in {countdown}s</span>
              </div>

              {/* Matchup Comparison Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Current Player Card */}
                <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentUser.name || currentUser.username}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser.eloRating} ELO • {currentUser.tier}
                  </div>
                </div>

                {/* Opponent Card */}
                <div className="p-4 rounded-2xl border bg-rose-50/50 dark:bg-rose-500/[0.05] border-rose-200 dark:border-rose-500/20 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-200 dark:bg-rose-900 flex items-center justify-center font-bold text-rose-800 dark:text-rose-200">
                    {opponent.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {opponent.name || opponent.username}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {opponent.eloRating} ELO • {opponent.tier}
                  </div>
                </div>
              </div>

              {/* Match Synergy Pill */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span>Fair Matchup: Δ{(opponent.eloRating - currentUser.eloRating > 0 ? "+" : "") + (opponent.eloRating - currentUser.eloRating)} ELO rating difference</span>
              </div>
            </div>
          )}

          {status === "ready" && (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <Sparkles className="w-12 h-12 mx-auto text-emerald-500 animate-spin" />
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                Synchronizing Battle Arena...
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Opening code editor environment and real-time test runner.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions with Focus Trapped Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-end gap-3">
          {status === "searching" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className={cn(
                "w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold",
                "border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10",
                "focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              )}
            >
              Cancel Matchmaking
            </Button>
          )}

          {status === "found" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-slate-300 dark:border-white/10"
              >
                Decline Match
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setStatus("ready");
                  if (onAcceptMatch) onAcceptMatch("match_sim_8921");
                }}
                className={cn(
                  "w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white",
                  "bg-emerald-600 hover:bg-emerald-500 transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                )}
              >
                Accept Battle Now
              </Button>
            </>
          )}

          {status === "cancelled" && (
            <Button
              type="button"
              onClick={() => {
                setStatus("searching");
                setElapsed(0);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-enter Queue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
