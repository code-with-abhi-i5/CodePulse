"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Package, PackageOpen, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types";

// ===========================
// Constants
// ===========================

const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#34d399", "#10b981"];
const CHEST_OPEN_DELAY_MS = 450;
const COUNT_UP_DURATION_MS = 1400;

// ===========================
// Helpers
// ===========================

/** Counts from `from` to `to`. With `animate` false it is simply `to`. */
function useCountUp(from: number, to: number, animate: boolean) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!animate) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, from, to]);

  return animate ? value : to;
}

/** Golden and emerald stars. Loaded on demand so it never runs during server rendering. */
async function fireConfetti() {
  try {
    const { default: confetti } = await import("canvas-confetti");
    const base = {
      spread: 360,
      ticks: 70,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 30,
      colors: CONFETTI_COLORS,
      shapes: ["star" as const],
      zIndex: 100,
      disableForReducedMotion: true,
    };

    confetti({
      ...base,
      particleCount: 40,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.4 },
    });
    window.setTimeout(() => {
      confetti({
        ...base,
        particleCount: 25,
        scalar: 0.8,
        origin: { x: 0.5, y: 0.4 },
      });
    }, 180);
  } catch {
    // The canvas can be unavailable in JSDOM or restricted contexts.
  }
}

// ===========================
// Types
// ===========================

export interface ClaimRewardModalProps {
  /** Whether the modal is open (accepts isOpen or open) */
  isOpen?: boolean;
  open?: boolean;
  /** Modal close callback */
  onClose: () => void;
  /** Dialog open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** The completed challenge details */
  challenge: Pick<Challenge, "title" | "xpReward">;
  /** The user's XP before this reward is added */
  previousXp: number;
  /** Additional styling class */
  className?: string;
}

// ===========================
// Celebration (mounted only while the dialog is open, so it starts fresh each time)
// ===========================

function RewardCelebration({
  onClose,
  challenge,
  previousXp,
}: Pick<ClaimRewardModalProps, "onClose" | "challenge" | "previousXp">) {
  const reduceMotion = useReducedMotion() ?? false;
  const newXp = previousXp + challenge.xpReward;
  const [chestOpened, setChestOpened] = useState(false);
  const chestOpen = reduceMotion || chestOpened;
  const displayedXp = useCountUp(previousXp, newXp, !reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;

    const timer = window.setTimeout(() => {
      setChestOpened(true);
      void fireConfetti();
    }, CHEST_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const ChestIcon = chestOpen ? PackageOpen : Package;

  return (
    <div className="flex flex-col items-center text-center space-y-4 sm:space-y-5">
      <DialogHeader className="items-center text-center p-0 space-y-2">
        <motion.div
          animate={
            chestOpened && !reduceMotion
              ? { scale: [1, 1.25, 1], rotate: [0, -6, 6, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.5 }}
          className={cn(
            "relative mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-3xl",
            "border border-amber-500/30 bg-amber-500/10",
            "shadow-[0_0_35px_-8px_rgba(251,191,36,0.4)] dark:shadow-[0_0_40px_-8px_rgba(251,191,36,0.6)]"
          )}
        >
          <ChestIcon
            className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 dark:text-amber-300 transition-colors"
            aria-hidden="true"
          />
        </motion.div>

        <DialogTitle className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-foreground">
          Reward claimed!
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-xs mx-auto">
          You completed &quot;{challenge.title}&quot;.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1 sm:space-y-1.5 py-1">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-bold",
            "bg-amber-500/10 text-amber-600 border border-amber-500/20",
            "dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
          )}
        >
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          <span>+{challenge.xpReward} XP</span>
        </div>

        <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-muted-foreground dark:text-muted-foreground mt-2">
          Total XP
        </p>
        <p
          aria-hidden="true"
          className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400"
        >
          {displayedXp.toLocaleString()}
        </p>
        <p className="sr-only" role="status">
          Total XP went from {previousXp.toLocaleString()} to{" "}
          {newXp.toLocaleString()}.
        </p>
      </div>

      <div className="w-full pt-2">
        <Button
          type="button"
          onClick={onClose}
          className={cn(
            "w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base",
            "bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400",
            "text-zinc-950 shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          Awesome!
        </Button>
      </div>
    </div>
  );
}

// ===========================
// Component
// ===========================

export function ClaimRewardModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  challenge,
  previousXp,
  className,
}: ClaimRewardModalProps) {
  const isModalOpen = open ?? isOpen ?? false;

  // Strict Escape key listener
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        onOpenChange?.(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, onClose, onOpenChange]);

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          onOpenChange?.(false);
        }
      }}
    >
      <DialogContent
        data-slot="claim-reward-modal"
        role="dialog"
        showCloseButton={false}
        className={cn(
          "w-full max-w-[calc(100%-2rem)] sm:max-w-md",
          "rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center",
          "bg-background text-foreground dark:bg-card dark:text-card-foreground",
          "border border-border/80 dark:border-border/60 shadow-2xl backdrop-blur-xl",
          "transition-all duration-200 outline-none",
          className
        )}
      >
        <RewardCelebration
          onClose={onClose}
          challenge={challenge}
          previousXp={previousXp}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ClaimRewardModal;
