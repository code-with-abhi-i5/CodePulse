"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { RARITY_COLORS } from "@/lib/constants";
import { AnimatedRing } from "@/components/animations/animated-counter";
import {
  Lock,
  Zap,
  GitCommit,
  Star,
  Flame,
  Users,
  Languages,
  Award,
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
};

// ===========================
// Types
// ===========================

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

// ===========================
// Component
// ===========================

export function AchievementCard({
  achievement,
  className,
}: AchievementCardProps) {
  const rarity = RARITY_COLORS[achievement.rarity];
  const Icon = ICON_MAP[achievement.icon] ?? Award;
  const isPartial =
    !achievement.isUnlocked &&
    achievement.progress > 0 &&
    achievement.progress < achievement.target;
  const progressPercentage = Math.round(
    (achievement.progress / achievement.target) * 100
  );

  // Tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      id={`achievement-${achievement.id}`}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "group relative overflow-hidden rounded-[20px]",
        "bg-[#111827]/80 backdrop-blur-xl",
        "border",
        achievement.isUnlocked ? rarity?.border : "border-white/[0.04]",
        "p-6",
        "shadow-lg shadow-black/20",
        achievement.isUnlocked && rarity?.glow && `shadow-lg ${rarity.glow}`,
        !achievement.isUnlocked && "opacity-75",
        "cursor-pointer select-none",
        className
      )}
    >
      {/* Rarity glow behind card */}
      {achievement.isUnlocked && (
        <div
          className={cn(
            "absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-30",
            rarity?.bg
          )}
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon with ring progress or simple circle */}
        <div className="relative mb-4">
          {isPartial ? (
            <AnimatedRing
              value={achievement.progress}
              max={achievement.target}
              size={72}
              strokeWidth={5}
            >
              <Icon
                className={cn(
                  "h-7 w-7",
                  achievement.isUnlocked ? rarity?.text : "text-slate-500"
                )}
              />
            </AnimatedRing>
          ) : (
            <div
              className={cn(
                "flex h-[72px] w-[72px] items-center justify-center rounded-full",
                achievement.isUnlocked
                  ? rarity?.bg
                  : "bg-white/[0.04]"
              )}
            >
              {achievement.isUnlocked ? (
                <Icon className={cn("h-8 w-8", rarity?.text)} />
              ) : (
                <Lock className="h-7 w-7 text-slate-600" />
              )}
            </div>
          )}

          {/* Locked overlay badge */}
          {!achievement.isUnlocked && !isPartial && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-white/[0.08]">
              <Lock className="h-3 w-3 text-slate-500" />
            </div>
          )}
        </div>

        {/* Rarity indicator */}
        <span
          className={cn(
            "mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            rarity?.bg,
            rarity?.text
          )}
        >
          {achievement.rarity}
        </span>

        {/* Title */}
        <h4
          className={cn(
            "text-sm font-semibold mb-1",
            achievement.isUnlocked ? "text-white" : "text-slate-400"
          )}
        >
          {achievement.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
          {achievement.description}
        </p>

        {/* Progress text for partial */}
        {isPartial && (
          <p className="text-xs font-medium text-slate-400 mb-3">
            {achievement.progress}/{achievement.target}{" "}
            <span className="text-slate-500">({progressPercentage}%)</span>
          </p>
        )}

        {/* XP reward */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
            achievement.isUnlocked
              ? "bg-amber-500/10"
              : "bg-white/[0.03]"
          )}
        >
          <Zap
            className={cn(
              "h-3.5 w-3.5",
              achievement.isUnlocked ? "text-amber-400" : "text-slate-600"
            )}
          />
          <span
            className={cn(
              "text-xs font-bold",
              achievement.isUnlocked ? "text-amber-400" : "text-slate-600"
            )}
          >
            +{achievement.xpReward} XP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
