"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RARITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import {
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
  Award,
  Zap,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";
import type { Achievement } from "@/types";

// ===========================
// Icon map
// ===========================

const ICON_MAP: Record<string, React.ElementType> = {
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
  Award,
  Trophy,
  Target,
  Sparkles,
};

// ===========================
// X (Twitter) Logo SVG
// ===========================

function XLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ===========================
// Rarity Visual Themes
// ===========================

const RARITY_THEMES: Record<
  string,
  {
    gradient: string;
    border: string;
    badge: string;
    glow: string;
    textColor: string;
    label: string;
  }
> = {
  common: {
    gradient: "from-slate-500/20 via-slate-600/10 to-transparent",
    border: "border-slate-500/30",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    glow: "rgba(148, 163, 184, 0.2)",
    textColor: "text-slate-400",
    label: "Common",
  },
  rare: {
    gradient: "from-blue-500/25 via-cyan-500/10 to-transparent",
    border: "border-blue-500/40",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    glow: "rgba(59, 130, 246, 0.35)",
    textColor: "text-blue-400",
    label: "Rare",
  },
  epic: {
    gradient: "from-purple-500/30 via-pink-500/10 to-transparent",
    border: "border-purple-500/40",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    glow: "rgba(168, 85, 247, 0.35)",
    textColor: "text-purple-400",
    label: "Epic",
  },
  legendary: {
    gradient: "from-amber-500/30 via-orange-500/15 to-transparent",
    border: "border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    glow: "rgba(245, 158, 11, 0.4)",
    textColor: "text-amber-400",
    label: "Legendary",
  },
};

// ===========================
// Component Props
// ===========================

interface AchievementShareModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

// ===========================
// Confetti Animation Trigger
// ===========================

function triggerCelebrationConfetti() {
  if (typeof window === "undefined") return;

  try {
    const colors = [
      "#8b5cf6",
      "#ec4899",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#6366f1",
    ];

    // Initial starburst from center
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    // Dual-angle side celebration
    const timer = setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.7 },
        colors,
        zIndex: 9999,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.7 },
        colors,
        zIndex: 9999,
        disableForReducedMotion: true,
      });
    }, 150);

    return () => clearTimeout(timer);
  } catch {
    // Graceful fallback if canvas is not supported
  }
}

export function AchievementShareModal({
  achievement,
  isOpen,
  onClose,
}: AchievementShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Trigger confetti burst on modal open for unlocked achievements
  useEffect(() => {
    if (isOpen && achievement?.isUnlocked) {
      const cleanup = triggerCelebrationConfetti();
      return cleanup;
    }
  }, [isOpen, achievement]);

  if (!achievement) return null;

  const rarityKey = (achievement.rarity || "common").toLowerCase();
  const theme = RARITY_THEMES[rarityKey] || RARITY_THEMES.common;
  const legacyRarity = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
  const Icon = ICON_MAP[achievement.icon] ?? Award;

  const progressPercentage = Math.min(
    100,
    Math.round(
      achievement.target > 0
        ? (achievement.progress / achievement.target) * 100
        : 100
    )
  );

  // Social Share handler
  const handleShareOnX = () => {
    const shareText = `🏆 I just unlocked the "${achievement.title}" achievement on CodePulse! (+${achievement.xpReward} XP)\n\nTrack your developer journey and battle on CodePulse:\nhttps://codepulse.dev\n\n#CodePulse #NSoC2026`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  // Copy Link handler
  const handleCopyLink = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/achievements#achievement-${achievement.id}`
        : `https://codepulse.dev/achievements#achievement-${achievement.id}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success("Achievement link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/10 text-white rounded-[28px] sm:rounded-[32px] p-0 overflow-hidden shadow-2xl">
        {/* Top Decorative Ambient Banner */}
        <div
          className={cn(
            "h-28 w-full relative bg-gradient-to-b overflow-hidden",
            theme.gradient
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F19]/95" />

          {/* Rarity badge pill in top right */}
          <div className="absolute top-5 right-5 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm",
                theme.badge
              )}
            >
              <Sparkles className="w-3 h-3" />
              {theme.label}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-16 relative z-10 flex flex-col items-center text-center">
          {/* High-Resolution Badge Icon Art */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="relative mb-4 group"
          >
            {/* Ambient pulsing glow */}
            <div
              className="absolute -inset-2 rounded-3xl blur-xl opacity-60 transition-opacity"
              style={{ backgroundColor: theme.glow }}
            />

            <div
              className={cn(
                "relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center border-2 shadow-2xl backdrop-blur-md transition-transform duration-300 group-hover:scale-105",
                achievement.isUnlocked
                  ? cn(theme.border, legacyRarity.bg || "bg-white/10")
                  : "bg-slate-900 border-white/10"
              )}
              style={{
                boxShadow: achievement.isUnlocked
                  ? `0 0 35px ${theme.glow}`
                  : undefined,
              }}
            >
              {achievement.isUnlocked ? (
                <Icon
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md",
                    theme.textColor
                  )}
                />
              ) : (
                <Lock className="w-12 h-12 text-slate-500" />
              )}
            </div>

            {/* Unlocked / Locked mini status indicator badge */}
            <div className="absolute -bottom-2 -right-2">
              {achievement.isUnlocked ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-2 border-[#0B0F19]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 shadow-lg border-2 border-[#0B0F19]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Dialog Header / Title */}
          <DialogHeader className="w-full text-center sm:text-center items-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground font-medium mb-1">
              <span>{achievement.category}</span>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {achievement.title}
            </DialogTitle>

            <DialogDescription className="text-slate-400 text-sm mt-1 max-w-sm">
              {achievement.description}
            </DialogDescription>
          </DialogHeader>

          {/* XP Reward and Unlock Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 my-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm shadow-sm">
              <Zap className="w-4 h-4 fill-amber-400/20" />
              +{achievement.xpReward} XP Reward
            </div>

            {achievement.isUnlocked ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {achievement.unlockedAt ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Unlocked{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                ) : (
                  "Unlocked"
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400 font-semibold text-xs">
                <Lock className="w-3.5 h-3.5" />
                Locked (In Progress)
              </div>
            )}
          </div>

          {/* Unlock Criteria Box */}
          <div className="w-full rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-left my-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Target className="w-3.5 h-3.5 text-primary" /> Exact Unlock Criteria
              </span>
              <span className="text-white font-bold">
                {achievement.progress}/{achievement.target} ({progressPercentage}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  achievement.isUnlocked
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-gradient-to-r from-purple-500 to-blue-500"
                )}
              />
            </div>

            <p className="text-xs text-slate-400 mt-2.5">
              Goal: {achievement.description}
            </p>
          </div>

          {/* Action Buttons: Share on X and Copy Link */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleShareOnX}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-white hover:bg-slate-100 text-black shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              title="Share on X (Twitter)"
            >
              <XLogo className="w-4 h-4" />
              <span>Share on X</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-[0.98] cursor-pointer"
              title="Copy Link to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

