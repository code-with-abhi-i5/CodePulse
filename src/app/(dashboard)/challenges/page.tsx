"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { ChallengeCard } from "@/components/cards/challenge-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types";

import {
  useActiveChallenges,
  calculateChallengeProgress,
  DEFAULT_CHALLENGES,
  type RawChallenge,
} from "@/hooks/api/use-challenges";
import { useCurrentUser } from "@/hooks/api/use-auth";

const statusTabs = [
  { id: "all", label: "All", icon: Target },
  { id: "active", label: "Active", icon: Flame },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const typeTabs = [
  { id: "all", label: "All Types" },
  { id: "DAILY", label: "Daily" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "MONTHLY", label: "Monthly" },
  { id: "SEASONAL", label: "Seasonal" },
];

interface FormattedChallenge extends Challenge {
  rawType: string;
}

export default function ChallengesPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: activeChallengesData, isLoading } = useActiveChallenges();
  const { data: currentUser } = useCurrentUser();
  const currentXp: number = currentUser?.rating?.xp ?? 0;

  // Use API challenges if available, otherwise fallback to rich default challenges
  const baseChallenges: RawChallenge[] =
    activeChallengesData && activeChallengesData.length > 0
      ? activeChallengesData
      : DEFAULT_CHALLENGES;

  // Connect challenges dynamically to live user statistics
  const realChallenges: FormattedChallenge[] = baseChallenges.map((c) => {
    const { progress, isCompleted } = calculateChallengeProgress(c, currentUser);

    const mappedDifficulty = (c.difficulty || "medium").toLowerCase() as Challenge["difficulty"];
    const mappedType = (c.type || "daily").toLowerCase() as Challenge["type"];

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      type: mappedType,
      rawType: (c.type || "DAILY").toUpperCase(),
      difficulty: mappedDifficulty,
      xpReward: c.xpReward,
      progress,
      target: c.target,
      isCompleted,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
      icon: c.icon || "Target",
      category: c.category || "General",
    };
  });

  // Calculate live counts
  const totalActiveCount = realChallenges.filter((c) => !c.isCompleted).length;
  const totalCompletedCount = realChallenges.filter((c) => c.isCompleted).length;
  const xpEarned = realChallenges
    .filter((c) => c.isCompleted)
    .reduce((acc, c) => acc + (c.xpReward || 0), 0);
  const totalXpAvailable = realChallenges.reduce(
    (acc, c) => acc + (c.xpReward || 0),
    0
  );

  // Filter by Type
  const typeFiltered =
    typeFilter === "all"
      ? realChallenges
      : realChallenges.filter((c) => c.rawType === typeFilter);

  // Filter by Status
  const statusFiltered = typeFiltered.filter((c) => {
    if (statusFilter === "active") return !c.isCompleted;
    if (statusFilter === "completed") return c.isCompleted;
    return true;
  });

  const active = statusFiltered.filter((c) => !c.isCompleted);
  const completed = statusFiltered.filter((c) => c.isCompleted);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-[16px] p-4 text-center space-y-2 animate-pulse">
              <div className="h-7 w-16 mx-auto bg-white/5 rounded" />
              <div className="h-3 w-20 mx-auto bg-white/5 rounded" />
            </div>
          ))}
        </div>

        <div className="h-10 w-80 bg-white/5 rounded-xl animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-[20px] p-5 h-44 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/5 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-white/5 rounded-full" />
              </div>
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-2 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Challenges
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete challenges to earn XP and level up your developer rating
        </p>
      </div>

      {/* Summary cards connected to live state */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", value: totalActiveCount, color: "text-blue-400" },
          { label: "Completed", value: totalCompletedCount, color: "text-emerald-400" },
          { label: "XP Earned", value: xpEarned.toLocaleString(), color: "text-amber-400" },
          { label: "Total XP Available", value: totalXpAvailable.toLocaleString(), color: "text-purple-400" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-[16px] p-4 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Controls: Status Tabs & Type Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as "all" | "active" | "completed")}
        >
          <TabsList
            className="bg-white/5 border border-white/10 p-1 rounded-xl"
            aria-label="Filter challenges by completion status"
          >
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.id === "all"
                  ? realChallenges.length
                  : tab.id === "active"
                  ? totalActiveCount
                  : totalCompletedCount;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5 cursor-pointer"
                  aria-label={`${tab.label} challenges (${count})`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                  <span className="opacity-70 text-[11px]">({count})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Cadence / Type Pills */}
        <div className="flex flex-wrap gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {typeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                typeFilter === tab.id
                  ? "bg-white/10 text-white font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screen reader live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Showing {statusFiltered.length} challenges: {active.length} active and {completed.length} completed.
      </div>

      {/* Active challenges section */}
      {active.length > 0 && (
        <section aria-label="Active challenges">
          {statusFilter === "all" && (
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-400" />
              Active Challenges ({active.length})
            </h2>
          )}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((challenge) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard challenge={challenge} currentXp={currentXp} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* Completed challenges section */}
      {completed.length > 0 && (
        <section aria-label="Completed challenges">
          {statusFilter === "all" && (
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed ({completed.length})
            </h2>
          )}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((challenge) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard challenge={challenge} currentXp={currentXp} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* Empty State */}
      {statusFiltered.length === 0 && (
        <div
          role="status"
          aria-label="No challenges available"
          className="glass-card rounded-[20px] p-12 text-center border border-white/5 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground">
            <Target className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold">No challenges found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {statusFilter === "completed"
              ? "You haven't completed any challenges in this category yet. Keep pushing your commits, reviews, and PRs!"
              : "There are no challenges under the selected filter right now. Check back soon!"}
          </p>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
