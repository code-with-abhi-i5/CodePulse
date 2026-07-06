"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TIER_COLORS } from "@/lib/constants";
import {
  AnimatedCounter,
  AnimatedProgress,
  AnimatedRing,
} from "@/components/animations/animated-counter";
import { Trophy, TrendingUp, Crown, Sparkles } from "lucide-react";
import type { DeveloperRating } from "@/types";

// ===========================
// Types
// ===========================

interface DeveloperRatingCardProps {
  rating: DeveloperRating;
  username?: string;
  className?: string;
}

// ===========================
// Component
// ===========================

export function DeveloperRatingCard({
  rating,
  username,
  className,
}: DeveloperRatingCardProps) {
  const tierStyle = TIER_COLORS[rating.tier] ?? TIER_COLORS["Bronze"];
  const xpPercentage = Math.round(
    (rating.xp / rating.xpToNextLevel) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className={cn(
        "relative overflow-hidden rounded-[24px]",
        "bg-[#111827]/80 backdrop-blur-xl",
        "border border-white/[0.06]",
        "p-8",
        "shadow-xl shadow-black/20",
        className
      )}
    >
      {/* Background accent glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/8 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Developer Rating
              </h3>
              {username && (
                <p className="text-sm text-slate-400">@{username}</p>
              )}
            </div>
          </div>

          {/* Tier Badge */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2",
              "bg-gradient-to-r shadow-lg",
              tierStyle.bg,
              tierStyle.glow
            )}
          >
            <Crown className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">
              {rating.tier}
            </span>
          </motion.div>
        </div>

        {/* Main rating + growth ring row */}
        <div className="flex items-center gap-8 mb-8">
          {/* Big animated rating number */}
          <div className="flex flex-col items-center">
            <AnimatedCounter
              value={rating.overall}
              decimals={1}
              className="text-6xl font-extrabold text-white tracking-tighter"
            />
            <p className="mt-1 text-sm font-medium text-slate-400">
              Overall Score
            </p>
          </div>

          {/* Divider */}
          <div className="h-20 w-px bg-white/[0.06]" />

          {/* Growth Score Ring */}
          <div className="flex flex-col items-center gap-2">
            <AnimatedRing value={rating.growthScore || 0} max={100} size={88} strokeWidth={7}>
              <div className="flex flex-col items-center">
                <AnimatedCounter
                  value={rating.growthScore || 0}
                  className="text-xl font-bold text-white"
                />
              </div>
            </AnimatedRing>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs font-medium text-slate-400">
                Growth Score
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-20 w-px bg-white/[0.06]" />

          {/* Rank */}
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-slate-500">#</span>
              <AnimatedCounter
                value={rating.rank}
                className="text-3xl font-bold text-white tracking-tight"
              />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              of{" "}
              <span className="text-slate-400 font-medium">
                {(rating.totalDevelopers || 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Level & XP Progress */}
        <div className="space-y-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Level {rating.level}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {xpPercentage}% to Level {rating.level + 1}
            </span>
          </div>

          <AnimatedProgress
            value={rating.xp}
            max={rating.xpToNextLevel}
            size="md"
            barClassName="from-purple-500 via-violet-500 to-blue-500"
          />

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <span className="text-slate-300 font-medium">
                {rating.xp.toLocaleString()}
              </span>{" "}
              XP
            </span>
            <span>{rating.xpToNextLevel.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
