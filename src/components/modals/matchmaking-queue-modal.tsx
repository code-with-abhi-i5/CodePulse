"use client";

import * as React from "react";
import {
  Swords,
  Loader2,
  Users,
  CheckCircle,
  X,
  Clock,
  Radio,
  Trophy,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MatchmakingPlayerProfile {
  id?: string;
  username: string;
  name?: string;
  avatar?: string;
  score?: number;
  rating?: number;
  tier?: string;
}

export interface MatchmakingQueueModalProps {
  /** Whether modal is open (accepts isOpen or open) */
  isOpen?: boolean;
  open?: boolean;
  /** Modal close request callback */
  onClose?: () => void;
  /** Open change state handler */
  onOpenChange?: (open: boolean) => void;
  /** Currently authenticated user profile */
  currentUser?: MatchmakingPlayerProfile | null;
  /** Matched opponent details if already determined externally */
  opponent?: MatchmakingPlayerProfile | null;
  /** Explicit queue status: "searching" | "found" | "connecting" | "error" | "idle" */
  queueStatus?: "searching" | "found" | "connecting" | "error" | "idle";
  /** Callback invoked when the user cancels the matchmaking queue */
  onCancelQueue?: () => void;
  /** Callback invoked when user accepts or launches into the matched arena */
  onAcceptMatch?: (opponent: MatchmakingPlayerProfile) => void;
  /** Callback triggered when a match has been found (supports auto-matching) */
  onMatchFound?: (opponent: MatchmakingPlayerProfile) => void;
  /** Match mode: "ranked" | "casual" | "speed-coding" | "algorithm" */
  mode?: "ranked" | "casual" | "speed-coding" | "algorithm";
  /** Target match difficulty */
  difficulty?: "easy" | "medium" | "hard";
  /** Estimated wait time in seconds (default: 15) */
  estimatedWaitSeconds?: number;
  /** Whether match auto-launches upon countdown completion */
  autoLaunchOnCountdown?: boolean;
  /** Additional styling classes */
  className?: string;
}

export function MatchmakingQueueModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  currentUser,
  opponent: propOpponent,
  queueStatus: propQueueStatus,
  onCancelQueue,
  onAcceptMatch,
  onMatchFound,
  mode = "ranked",
  difficulty = "medium",
  estimatedWaitSeconds = 15,
  autoLaunchOnCountdown = true,
  className,
}: MatchmakingQueueModalProps) {
  const isModalOpen = open ?? isOpen ?? false;

  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [internalStatus, setInternalStatus] = React.useState<
    "searching" | "found" | "connecting" | "idle"
  >("searching");
  const [countdown, setCountdown] = React.useState(5);
  const [matchedOpponent, setMatchedOpponent] =
    React.useState<MatchmakingPlayerProfile | null>(propOpponent ?? null);

  const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const currentStatus = propQueueStatus ?? internalStatus;
  const activeOpponent = propOpponent ?? matchedOpponent;

  const handleClose = React.useCallback(() => {
    onCancelQueue?.();
    onClose?.();
    onOpenChange?.(false);
  }, [onCancelQueue, onClose, onOpenChange]);

  // Strict Escape key listener across all custom queue states
  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, handleClose]);

  // Manage queue timer and simulation when searching
  React.useEffect(() => {
    if (!isModalOpen) {
      setElapsedSeconds(0);
      setCountdown(5);
      setInternalStatus("searching");
      setMatchedOpponent(null);
      return;
    }

    if (currentStatus !== "searching") return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        // Auto-match simulation after 6 seconds if no opponent provided externally
        if (prev === 5 && !propOpponent) {
          const simulatedOpponent: MatchmakingPlayerProfile = {
            id: "opponent-user-77",
            username: "alexdev99",
            name: "Alex Rivera",
            avatar:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            score: 1480,
            rating: 1520,
            tier: "DIAMOND",
          };
          setMatchedOpponent(simulatedOpponent);
          setInternalStatus("found");
          onMatchFound?.(simulatedOpponent);
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isModalOpen, currentStatus, propOpponent, onMatchFound]);

  // Countdown when match is found
  React.useEffect(() => {
    if (!isModalOpen || currentStatus !== "found") return;

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          if (autoLaunchOnCountdown && activeOpponent) {
            onAcceptMatch?.(activeOpponent);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isModalOpen, currentStatus, autoLaunchOnCountdown, activeOpponent, onAcceptMatch]);

  const formattedTime = React.useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, [elapsedSeconds]);

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        data-slot="matchmaking-queue-modal"
        role="dialog"
        aria-modal="true"
        showCloseButton={false}
        className={cn(
          "w-full max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg",
          "rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8",
          "bg-background text-foreground dark:bg-card dark:text-card-foreground",
          "border border-border/80 dark:border-border/60 shadow-2xl",
          "transition-all duration-200 outline-none text-center",
          className
        )}
      >
        <div className="flex flex-col items-center">
          {/* Top Badge: Match Mode & Status */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                "bg-primary/10 text-primary border border-primary/20",
                "dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30"
              )}
            >
              <Radio className="size-3 animate-pulse text-rose-500" />
              <span>{mode} match</span>
            </span>

            <span className="text-xs text-muted-foreground capitalize">
              • {difficulty}
            </span>
          </div>

          {/* Close button in top right */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cancel matchmaking"
            className={cn(
              "absolute top-4 right-4 rounded-full p-2 cursor-pointer",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              "dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted/40",
              "transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <X className="size-4" />
          </button>

          {/* Status Header */}
          <DialogHeader className="p-0 text-center space-y-2 mb-6">
            <div
              className={cn(
                "mx-auto flex size-14 sm:size-16 items-center justify-center rounded-2xl sm:rounded-3xl transition-transform",
                currentStatus === "searching"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 dark:bg-rose-500/20 dark:border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30"
              )}
              aria-hidden="true"
            >
              {currentStatus === "searching" ? (
                <Swords className="size-7 sm:size-8 animate-bounce text-rose-500" />
              ) : (
                <CheckCircle className="size-7 sm:size-8 text-emerald-500 animate-in zoom-in" />
              )}
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-foreground">
              {currentStatus === "searching"
                ? "Matchmaking Queue"
                : "Opponent Found!"}
            </DialogTitle>

            <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-sm mx-auto">
              {currentStatus === "searching"
                ? "Scanning active players with comparable ELO rating and tier standings..."
                : `Synchronizing battle sandbox. Match starting in ${countdown}s...`}
            </DialogDescription>
          </DialogHeader>

          {/* Central Queue / Match Visual */}
          <div className="w-full py-2 sm:py-4 flex flex-col items-center justify-center">
            {currentStatus === "searching" ? (
              <div className="flex flex-col items-center space-y-4">
                {/* Radar Pulse Animation */}
                <div className="relative flex items-center justify-center size-24 sm:size-28">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500/30 animate-ping opacity-75" />
                  <div className="absolute inset-2 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                  <div className="size-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center">
                    <Users className="size-7 text-rose-500" />
                  </div>
                </div>

                {/* Digital Queue Timer */}
                <div
                  aria-live="polite"
                  className="flex flex-col items-center gap-1"
                >
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-foreground dark:text-foreground">
                    {formattedTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>Est. wait: ~{estimatedWaitSeconds}s</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Versus Card presentation */
              <div className="w-full rounded-2xl bg-muted/40 dark:bg-muted/20 border border-border/80 p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Current Player */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="relative size-12 sm:size-14 rounded-full border-2 border-primary overflow-hidden bg-muted">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.username || "You"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center font-bold text-primary">
                        {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-2 truncate max-w-[100px] sm:max-w-[120px]">
                    {currentUser?.username || "You"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {currentUser?.rating || 1500} ELO
                  </span>
                </div>

                {/* VS Badge with Countdown */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="size-9 sm:size-10 rounded-full bg-rose-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-rose-600/30">
                    VS
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 mt-1">
                    {countdown}s
                  </span>
                </div>

                {/* Opponent Player */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="relative size-12 sm:size-14 rounded-full border-2 border-rose-500 overflow-hidden bg-muted">
                    {activeOpponent?.avatar ? (
                      <img
                        src={activeOpponent.avatar}
                        alt={activeOpponent.username}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center font-bold text-rose-500">
                        {activeOpponent?.username?.charAt(0).toUpperCase() || "O"}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground mt-2 truncate max-w-[100px] sm:max-w-[120px]">
                    {activeOpponent?.username || "Opponent"}
                  </span>
                  <span className="text-[10px] text-rose-500 font-mono font-semibold">
                    {activeOpponent?.tier || "DIAMOND"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <DialogFooter className="w-full mt-6 flex flex-col-reverse sm:flex-row sm:justify-center gap-2.5 sm:gap-3 p-0">
            {currentStatus === "searching" ? (
              <Button
                ref={cancelButtonRef}
                type="button"
                variant="outline"
                size="default"
                onClick={handleClose}
                className={cn(
                  "w-full sm:w-auto min-w-[8rem] justify-center cursor-pointer",
                  "border-border hover:bg-muted dark:border-border dark:hover:bg-muted/50"
                )}
              >
                Cancel Queue
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => {
                  if (activeOpponent) onAcceptMatch?.(activeOpponent);
                }}
                className={cn(
                  "w-full sm:w-auto min-w-[8rem] justify-center cursor-pointer",
                  "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/25"
                )}
              >
                <Swords className="size-4 mr-1.5" />
                <span>Enter Battle Now ({countdown}s)</span>
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MatchmakingQueueModal;
