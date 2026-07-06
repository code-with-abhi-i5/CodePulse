"use client";

import { motion } from "motion/react";
import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  Eye,
  Star,
  GitFork,
  Trophy,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Activity } from "@/types";

const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  commit: { icon: GitCommit, color: "text-purple-400", bg: "bg-purple-500/10" },
  pull_request: { icon: GitPullRequest, color: "text-blue-400", bg: "bg-blue-500/10" },
  issue: { icon: CircleDot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  review: { icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  star: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  fork: { icon: GitFork, color: "text-orange-400", bg: "bg-orange-500/10" },
  achievement: { icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
  level_up: { icon: ArrowUp, color: "text-pink-400", bg: "bg-pink-500/10" },
};

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
  maxItems?: number;
}

export function ActivityTimeline({
  activities,
  className,
  maxItems = 8,
}: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("glass-card rounded-[20px] p-6", className)}>
      <h3 className="text-lg font-semibold mb-5">Recent Activity</h3>
      <div className="space-y-1">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => {
            const config = activityIcons[activity.type.toLowerCase()] || activityIcons.commit;
            const Icon = config.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: index * 0.05,
                }}
                className="flex items-start gap-3 py-3 group"
              >
                {/* Icon + Timeline line */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      config.bg
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  {index < displayActivities.length - 1 && (
                    <div className="w-px h-full bg-white/5 absolute top-10 left-1/2 -translate-x-1/2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activity.repository && (
                      <span className="text-xs text-primary/80 font-mono bg-primary/5 px-1.5 py-0.5 rounded">
                        {activity.repository}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No recent activity available.
          </div>
        )}
      </div>
    </div>
  );
}
