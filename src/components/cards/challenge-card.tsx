"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_COLORS } from "@/lib/constants";
import { AnimatedProgress } from "@/components/animations/animated-counter";
import {
  CheckCircle2,
  Clock,
  Zap,
  Flame,
  GitPullRequest,
  Eye,
  Globe,
  Check,
  Bug,
  Target,
} from "lucide-react";
import type { Challenge } from "@/types";

// ===========================
// Icon map for challenge icons
// ===========================

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  GitPullRequest,
  Eye,
  Globe,
  Check,
  Bug,
  Target,
};

// ===========================
// Helpers
// ===========================

function getTimeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ===========================
// Types
// ===========================

interface ChallengeCardProps {
  challenge: Challenge;
  className?: string;
}

// ===========================
// Component
// ===========================

export function ChallengeCard({ challenge, className }: ChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeRemaining(challenge.expiresAt)
  );

  useEffect(() => {
    if (challenge.isCompleted) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(challenge.expiresAt));
    }, 60_000);

    return () => clearInterval(interval);
  }, [challenge.expiresAt, challenge.isCompleted]);

  const difficulty = DIFFICULTY_COLORS[challenge.difficulty];
  const Icon = ICON_MAP[challenge.icon] ?? Target;
  const progressPercentage = Math.round(
    (challenge.progress / challenge.target) * 100
  );

  return (
    <motion.div
      id={`challenge-${challenge.id}`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-[20px]",
        "bg-[#111827]/80 backdrop-blur-xl",
        "border border-white/[0.06]",
        "p-5",
        "shadow-lg shadow-black/20",
        "hover:border-white/[0.12]",
        "transition-colors duration-300",
        challenge.isCompleted && "ring-1 ring-emerald-500/20",
        className
      )}
    >
      {/* Completed shimmer overlay */}
      {challenge.isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent" />
      )}

      <div className="relative z-10">
        {/* Top row: Icon + Difficulty + Time */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                challenge.isCompleted
                  ? "bg-emerald-500/15"
                  : "bg-white/[0.06]"
              )}
            >
              {challenge.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Icon className="h-5 w-5 text-slate-300" />
              )}
            </div>

            {/* Difficulty badge */}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                difficulty?.bg,
                difficulty?.text
              )}
            >
              {difficulty?.label}
            </span>
          </div>

          {/* Timer / Completed */}
          {challenge.isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Check className="h-3 w-3" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
          )}
        </div>

        {/* Title & description */}
        <div className="mb-4">
          <h4
            className={cn(
              "text-base font-semibold mb-1",
              challenge.isCompleted ? "text-emerald-300" : "text-white"
            )}
          >
            {challenge.title}
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
            {challenge.description}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Progress
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {challenge.progress}/{challenge.target}{" "}
              <span className="text-slate-500">({progressPercentage}%)</span>
            </span>
          </div>
          <AnimatedProgress
            value={challenge.progress}
            max={challenge.target}
            size="sm"
            barClassName={
              challenge.isCompleted
                ? "from-emerald-400 to-emerald-600"
                : "from-purple-500 to-blue-500"
            }
          />
        </div>

        {/* Footer: XP reward + Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">
              +{challenge.xpReward} XP
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 capitalize">
            {challenge.type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
