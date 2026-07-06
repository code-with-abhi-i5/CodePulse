"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/page-transition";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import {
  Trophy,
  ChevronUp,
  ChevronDown,
  Minus,
  ArrowRight,
  Medal,
} from "lucide-react";
import type { LeaderboardEntry } from "@/types";

// ===========================
// Types
// ===========================

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  title?: string;
  viewAllHref?: string;
  className?: string;
}

// ===========================
// Medal colors for top 3
// ===========================

const MEDAL_STYLES: Record<number, { bg: string; text: string; ring: string }> =
  {
    1: {
      bg: "bg-gradient-to-br from-yellow-400 to-amber-500",
      text: "text-yellow-900",
      ring: "ring-yellow-400/30",
    },
    2: {
      bg: "bg-gradient-to-br from-gray-300 to-gray-400",
      text: "text-gray-800",
      ring: "ring-gray-400/30",
    },
    3: {
      bg: "bg-gradient-to-br from-amber-600 to-amber-700",
      text: "text-amber-100",
      ring: "ring-amber-600/30",
    },
  };

// ===========================
// Component
// ===========================

export function LeaderboardPreview({
  entries,
  title = "Leaderboard",
  viewAllHref = "/leaderboard",
  className,
}: LeaderboardPreviewProps) {
  const top5 = entries.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className={cn(
        "relative overflow-hidden rounded-[24px]",
        "bg-[#111827]/80 backdrop-blur-xl",
        "border border-white/[0.06]",
        "shadow-xl shadow-black/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
            <Trophy className="h-4.5 w-4.5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>

        <motion.a
          id="leaderboard-view-all"
          href={viewAllHref}
          whileHover={{ x: 4 }}
          className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </motion.a>
      </div>

      {/* Entries */}
      <StaggerContainer className="px-3 pb-3" delay={0.06}>
        {top5.length > 0 ? (
          top5.map((entry) => {
            const rankChange = entry.previousRank - entry.rank;
            const isUp = rankChange > 0;
            const isDown = rankChange < 0;
            const medal = MEDAL_STYLES[entry.rank];

            return (
              <StaggerItem key={entry.developer.id}>
                <motion.div
                  id={`leaderboard-entry-${entry.rank}`}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3",
                    "transition-colors duration-200"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 flex justify-center">
                    {medal ? (
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2",
                          medal.bg,
                          medal.text,
                          medal.ring
                        )}
                      >
                        {entry.rank}
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={entry.developer.avatar}
                      alt={entry.developer.name}
                      className="h-9 w-9 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"
                    />
                    {entry.developer.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#111827]" />
                    )}
                  </div>

                  {/* Name & username */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {entry.developer.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      @{entry.developer.username}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right mr-2">
                    <AnimatedCounter
                      value={entry.score}
                      className="text-sm font-bold text-white"
                    />
                  </div>

                  {/* Rank change */}
                  <div className="w-10 flex-shrink-0 flex justify-end">
                    {isUp && (
                      <div className="flex items-center gap-0.5 text-emerald-400">
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">
                          {Math.abs(rankChange)}
                        </span>
                      </div>
                    )}
                    {isDown && (
                      <div className="flex items-center gap-0.5 text-red-400">
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">
                          {Math.abs(rankChange)}
                        </span>
                      </div>
                    )}
                    {!isUp && !isDown && (
                      <Minus className="h-3.5 w-3.5 text-slate-600" />
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Leaderboard is currently empty.
          </div>
        )}
      </StaggerContainer>
    </motion.div>
  );
}
