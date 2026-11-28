"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  Swords,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Code2,
  Award,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types";

export interface BattleVictoryShareData {
  readonly battleId: string;
  readonly opponentName: string;
  readonly challengeTitle: string;
  readonly xpEarned: number;
  readonly eloChange: number;
}

export interface ShareAchievementDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly achievement?: Achievement | null;
  readonly victory?: BattleVictoryShareData | null;
  readonly username?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ShareAchievementDialog({
  isOpen,
  onClose,
  achievement,
  victory,
  username = "codepulse_dev",
}: ShareAchievementDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "social" | "embed">("card");

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Close handler with callback
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ==========================================================================
  // Strict Escape Key Listener & Keyboard Focus Trap Engine
  // ==========================================================================
  useEffect(() => {
    if (!isOpen) return;

    // 1. Capture currently active element before opening dialog
    if (typeof document !== "undefined") {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    // 2. Initial focus: move focus to first interactive element
    const focusInitial = () => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogRef.current.focus();
      }
    };

    const animFrame = requestAnimationFrame(focusInitial);

    // 3. Global Escape and Tab Key Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key: dismiss dialog immediately from any child element
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Tab key: strict focus trapping inside dialog
      if (e.key === "Tab") {
        if (!dialogRef.current) return;

        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

        if (focusable.length === 0) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          // Shift + Tab: reverse cycle
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: forward cycle
          if (active === last || !dialogRef.current.contains(active)) {
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

      // 4. Restore focus upon closing
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function"
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, handleClose]);

  if (!isOpen || (!achievement && !victory)) {
    return null;
  }

  const isVictory = Boolean(victory);
  const title = isVictory
    ? `Victory Over ${victory?.opponentName}`
    : achievement?.title ?? "Achievement Unlocked";
  const description = isVictory
    ? `Won the head-to-head battle on "${victory?.challengeTitle}" gaining +${victory?.eloChange} ELO and +${victory?.xpEarned} XP!`
    : achievement?.description ?? "";
  const rarity = (achievement?.rarity || "legendary").toUpperCase();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://codepulse.dev";
  const shareUrl = isVictory
    ? `${baseUrl}/battles/results/${victory?.battleId || "latest"}`
    : `${baseUrl}/achievements#achievement-${achievement?.id || "unlock"}`;

  const shareText = isVictory
    ? `⚔️ Victory! Defeated ${victory?.opponentName} on CodePulse! (+${victory?.eloChange} ELO, +${victory?.xpEarned} XP)\n${shareUrl}\n#CodePulse #CodingBattle`
    : `🏆 Unlocked "${achievement?.title}" on CodePulse! (+${achievement?.xpReward} XP)\n${shareUrl}\n#CodePulse #Developer`;

  const markdownSnippet = `[![${title}](https://codepulse.dev/api/v1/og/badge/${achievement?.id || "victory"})](${shareUrl})`;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedLink(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdownSnippet);
      }
      setCopiedMarkdown(true);
      toast.success("GitHub Markdown embed copied!");
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      toast.error("Failed to copy markdown snippet");
    }
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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

      {/* Accessible Dialog Container with Strict Focus Trap & Escape Listener */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-achievement-title"
        aria-describedby="share-achievement-desc"
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl",
          "rounded-3xl border shadow-2xl overflow-hidden text-left outline-none",
          "transition-all duration-200 animate-in fade-in zoom-in-95",
          // Responsive & Theme Compatibility
          "bg-white dark:bg-slate-950",
          "border-slate-200 dark:border-white/10",
          "text-slate-900 dark:text-slate-50",
          "p-6 sm:p-8"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                isVictory
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-500"
              )}
            >
              {isVictory ? <Swords className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5",
                    isVictory
                      ? "text-rose-500 border-rose-500/20 bg-rose-500/10"
                      : "text-amber-500 border-amber-500/20 bg-amber-500/10"
                  )}
                >
                  {isVictory ? "Battle Victory" : rarity}
                </Badge>
                {achievement?.xpReward && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{achievement.xpReward} XP
                  </span>
                )}
                {victory?.eloChange && (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    +{victory.eloChange} ELO
                  </span>
                )}
              </div>
              <h2
                id="share-achievement-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1"
              >
                {title}
              </h2>
              <p
                id="share-achievement-desc"
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2"
              >
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close share achievement dialog"
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              "hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            )}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-4 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
          {(["card", "social", "embed"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                )}
              >
                {tab === "card" && "Badge Card"}
                {tab === "social" && "Share Channels"}
                {tab === "embed" && "Markdown Embed"}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="py-5 space-y-4">
          {activeTab === "card" && (
            <div
              data-testid="opengraph-preview-card"
              className={cn(
                "p-5 sm:p-6 rounded-2xl border text-center space-y-3",
                "bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08]"
              )}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                {isVictory ? <Swords className="w-8 h-8" /> : <Award className="w-8 h-8" />}
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {description}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                codepulse.dev • Verified Credential
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleShareX}
                className="w-full justify-center text-xs font-semibold h-11 rounded-xl border-slate-200 dark:border-white/10"
              >
                Share on X
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleShareLinkedIn}
                className="w-full justify-center text-xs font-semibold h-11 rounded-xl border-slate-200 dark:border-white/10"
              >
                LinkedIn
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleShareWhatsApp}
                className="w-full justify-center text-xs font-semibold h-11 rounded-xl border-slate-200 dark:border-white/10"
              >
                WhatsApp
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          )}

          {activeTab === "embed" && (
            <div className="space-y-2">
              <label htmlFor="markdown-embed-code" className="block text-xs font-semibold text-slate-500">
                README.md Markdown Snippet
              </label>
              <div className="relative">
                <input
                  id="markdown-embed-code"
                  type="text"
                  readOnly
                  value={markdownSnippet}
                  className="w-full pr-24 pl-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="absolute right-1 top-1 h-7 text-xs font-bold"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  <span>{copiedMarkdown ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions with Direct Link Copy */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>Public link ready to share</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/10"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                "px-5 py-2 text-xs font-bold rounded-xl text-white",
                copiedLink ? "bg-emerald-600" : "bg-primary hover:bg-primary/90",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              )}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export default and alias to support both import naming styles
export { ShareAchievementDialog as AchievementShareModal };
export default ShareAchievementDialog;
