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
  type LucideIcon,
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
  Swords,
  Globe,
  Share2,
} from "lucide-react";
import type { Achievement } from "@/types";

// ===========================
// Icon map
// ===========================

const ICON_MAP: Record<string, LucideIcon> = {
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
  Award,
  Trophy,
  Target,
  Sparkles,
  Swords,
};

// ===========================
// Social Logos SVG
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

function LinkedInLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
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
// Types & Props
// ===========================

export interface BattleVictoryShareData {
  battleId?: string;
  opponentName: string;
  challengeTitle: string;
  xpEarned: number;
  eloChange: number;
  duration?: string;
  accuracy?: number;
}

export interface AchievementShareModalProps {
  achievement?: Achievement | null;
  victory?: BattleVictoryShareData | null;
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

    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

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
  victory,
  isOpen,
  onClose,
}: AchievementShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Global Escape key listener across all custom modals
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  // Trigger celebration on modal open
  useEffect(() => {
    if (isOpen && (victory || achievement?.isUnlocked)) {
      const cleanup = triggerCelebrationConfetti();
      return cleanup;
    }
  }, [isOpen, achievement, victory]);

  if (!isOpen || (!achievement && !victory)) return null;

  const isVictory = Boolean(victory);
  const title = isVictory
    ? `Victory Over ${victory?.opponentName}`
    : achievement?.title ?? "Achievement Unlocked";
  const description = isVictory
    ? `Won the battle on "${victory?.challengeTitle}" gaining +${victory?.eloChange} ELO and +${victory?.xpEarned} XP!`
    : achievement?.description ?? "";
  const rarityKey = (achievement?.rarity || "legendary").toLowerCase();
  const theme = isVictory
    ? RARITY_THEMES.legendary
    : RARITY_THEMES[rarityKey] || RARITY_THEMES.common;
  const legacyRarity = achievement?.rarity
    ? RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common
    : RARITY_COLORS.legendary;
  const Icon = isVictory
    ? Swords
    : (achievement?.icon ? ICON_MAP[achievement.icon] ?? Award : Award);

  const shareUrl =
    typeof window !== "undefined"
      ? isVictory
        ? `${window.location.origin}/battles/results/${victory?.battleId || "latest"}`
        : `${window.location.origin}/achievements#achievement-${achievement?.id}`
      : `https://codepulse.dev`;

  const shareText = isVictory
    ? `⚔️ Victory! I just defeated ${victory?.opponentName} in a 1v1 battle on CodePulse! (+${victory?.eloChange} ELO, +${victory?.xpEarned} XP)\n\nChallenge developers worldwide on CodePulse:\n${shareUrl}\n\n#CodePulse #CodingBattle #NSoC2026`
    : `🏆 I just unlocked the "${achievement?.title}" achievement on CodePulse! (+${achievement?.xpReward} XP)\n\nTrack your developer journey:\n${shareUrl}\n\n#CodePulse #NSoC2026`;

  // Social Share handlers
  const handleShareOnX = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(linkedinUrl, "_blank", "noopener,noreferrer");
  };

  // Copy Link handler
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success(
        isVictory
          ? "Battle victory link copied to clipboard!"
          : "Achievement link copied to clipboard!"
      );
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

          {/* Rarity or Mode badge pill in top right */}
          <div className="absolute top-5 right-5 z-10">
            <span
              data-testid="share-modal-badge"
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm",
                theme.badge
              )}
            >
              <Sparkles className="w-3 h-3" />
              {isVictory ? "Victory" : theme.label}
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
                isVictory || achievement?.isUnlocked
                  ? cn(theme.border, legacyRarity.bg || "bg-white/10")
                  : "bg-slate-900 border-white/10"
              )}
              style={{
                boxShadow:
                  isVictory || achievement?.isUnlocked
                    ? `0 0 35px ${theme.glow}`
                    : undefined,
              }}
            >
              {isVictory || achievement?.isUnlocked ? (
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

            {/* Unlocked / Victory status indicator badge */}
            <div className="absolute -bottom-2 -right-2">
              {isVictory || achievement?.isUnlocked ? (
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
              <span>{isVictory ? "1v1 Coding Battle" : achievement?.category}</span>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </DialogTitle>

            <DialogDescription className="text-slate-400 text-sm mt-1 max-w-sm">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* XP & Rewards Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 my-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm shadow-sm">
              <Zap className="w-4 h-4 fill-amber-400/20" />
              +{isVictory ? victory?.xpEarned : achievement?.xpReward} XP Reward
            </div>

            {isVictory && victory && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm shadow-sm">
                <Trophy className="w-4 h-4" />
                +{victory.eloChange} ELO
              </div>
            )}

            {!isVictory && achievement?.isUnlocked && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {achievement.unlockedAt ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Unlocked{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  "Unlocked"
                )}
              </div>
            )}
          </div>

          {/* OpenGraph Social Card Preview */}
          <div
            data-testid="opengraph-preview-card"
            className="w-full rounded-2xl border border-white/10 bg-[#070A12] p-3 text-left shadow-lg overflow-hidden my-2.5"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground uppercase font-semibold tracking-wider pb-2 border-b border-white/5 mb-2.5">
              <span className="flex items-center gap-1.5 text-xs text-primary font-bold">
                <Share2 className="w-3.5 h-3.5" /> OpenGraph Preview
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
                <Globe className="w-3 h-3" /> codepulse.dev
              </span>
            </div>

            {/* OG Card Visual Media Banner */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-3.5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest text-primary font-semibold">
                  <Sparkles className="w-3 h-3" /> CodePulse Victory Card
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {isVictory
                    ? `Match MVP • +${victory?.eloChange} ELO • +${victory?.xpEarned} XP`
                    : description}
                </p>
              </div>

              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Buttons: Share on X, LinkedIn, and Copy Link */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <button
              type="button"
              onClick={handleShareOnX}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs bg-white hover:bg-slate-100 text-black shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              title="Share on X (Twitter)"
            >
              <XLogo className="w-3.5 h-3.5" />
              <span>Share on X</span>
            </button>

            <button
              type="button"
              onClick={handleShareOnLinkedIn}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs bg-[#0A66C2] hover:bg-[#004182] text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              title="Share on LinkedIn"
            >
              <LinkedInLogo className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-[0.98] cursor-pointer"
              title="Copy Link to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
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
