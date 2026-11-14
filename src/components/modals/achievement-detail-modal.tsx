"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Award,
  Lock,
  CheckCircle2,
  Zap,
  Share2,
  Copy,
  Check,
  ExternalLink,
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
} from "lucide-react";
import { RARITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Achievement } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
  Award,
};

interface AchievementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement | null;
}

export function AchievementDetailModal({
  isOpen,
  onClose,
  achievement,
}: AchievementDetailModalProps) {
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedMarkdown, setHasCopiedMarkdown] = useState(false);

  if (!achievement) return null;

  const rarity = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
  const Icon = ICON_MAP[achievement.icon] ?? Award;
  const isUnlocked = achievement.isUnlocked;
  const progressPercentage = Math.min(
    100,
    Math.round((achievement.progress / (achievement.target || 1)) * 100)
  );

  const formattedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const shareText = `I unlocked the "${achievement.title}" achievement on CodePulse (+${achievement.xpReward} XP)!`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://codepulse.dev/achievements";
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleShareOnTwitter = () => {
    window.open(twitterIntentUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopiedLink(true);
      toast.success("Achievement link copied to clipboard.");
      setTimeout(() => setHasCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const markdown = `[![CodePulse Achievement: ${achievement.title}](https://codepulse.dev/api/badge/achievement?id=${achievement.id})](${shareUrl})`;
      await navigator.clipboard.writeText(markdown);
      setHasCopiedMarkdown(true);
      toast.success("Markdown snippet copied to clipboard.");
      setTimeout(() => setHasCopiedMarkdown(false), 2000);
    } catch {
      toast.error("Failed to copy Markdown.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#0d1117] border-white/10 text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="items-center text-center space-y-3 pt-2">
          {/* Glowing Avatar Icon */}
          <div className="relative">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-transform",
                isUnlocked ? rarity.bg : "bg-white/[0.04]",
                isUnlocked ? rarity.border : "border-white/10"
              )}
            >
              {isUnlocked ? (
                <Icon className={cn("w-10 h-10", rarity.text)} />
              ) : (
                <Lock className="w-9 h-9 text-slate-500" />
              )}
            </div>
            {isUnlocked && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  rarity.bg,
                  rarity.text
                )}
              >
                {achievement.rarity}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10">
                {achievement.category}
              </span>
            </div>

            <DialogTitle className="text-xl font-bold text-white pt-1">
              {achievement.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 max-w-xs mx-auto">
              {achievement.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3">
          {/* Status & XP Info Box */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status</span>
              {isUnlocked ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Unlocked{formattedDate ? ` on ${formattedDate}` : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                  Locked ({progressPercentage}%)
                </span>
              )}
            </div>

            {/* Progress bar if locked or partial */}
            {!isUnlocked && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Progress</span>
                  <span>
                    {achievement.progress} / {achievement.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2.5">
              <span className="text-slate-400">XP Reward</span>
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>

          {/* Social Share & Actions */}
          {isUnlocked ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Share Achievement
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleShareOnTwitter}
                  className="w-full flex items-center justify-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white rounded-xl"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  Share on X
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white rounded-xl"
                >
                  {hasCopiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {hasCopiedLink ? "Link Copied" : "Copy Link"}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyMarkdown}
                className="w-full flex items-center justify-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white rounded-xl mt-1"
              >
                {hasCopiedMarkdown ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                )}
                {hasCopiedMarkdown ? "Markdown Snippet Copied" : "Copy README Badge Markdown"}
              </Button>
            </div>
          ) : (
            <div className="text-center p-3 rounded-xl border border-dashed border-white/10 text-xs text-slate-400">
              Complete the milestone requirements to unlock social sharing and earn your XP reward.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
