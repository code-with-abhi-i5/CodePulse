"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { ChallengeCard } from "@/components/cards/challenge-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Flame, Calendar, Trophy, Sparkles } from "lucide-react";

import { useActiveChallenges } from "@/hooks/api/use-challenges";

const tabs = [
  { id: "all", label: "All", icon: Target },
  { id: "DAILY", label: "Daily", icon: Flame },
  { id: "WEEKLY", label: "Weekly", icon: Calendar },
  { id: "MONTHLY", label: "Monthly", icon: Trophy },
  { id: "SEASONAL", label: "Seasonal", icon: Sparkles },
];

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: activeChallengesData, isLoading } = useActiveChallenges();

  // Map backend format to frontend format temporarily
  const realChallenges = (activeChallengesData || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type, // e.g. "DAILY"
    difficulty: c.difficulty.toLowerCase(),
    xpReward: c.xpReward,
    progress: 0,
    target: c.target,
    isCompleted: false,
    expiresAt: c.expiresAt,
    createdAt: c.createdAt,
    icon: c.icon || "Target",
    category: c.category,
  }));

  const filtered = activeTab === "all"
    ? realChallenges
    : realChallenges.filter((c: any) => c.type === activeTab);

  const active = filtered.filter((c: any) => !c.isCompleted);
  const completed = filtered.filter((c: any) => c.isCompleted);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading challenges...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Challenges
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete challenges to earn XP and level up
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", value: realChallenges.filter((c: any) => !c.isCompleted).length, color: "text-blue-400" },
          { label: "Completed", value: realChallenges.filter((c: any) => c.isCompleted).length, color: "text-emerald-400" },
          { label: "XP Earned", value: "0", color: "text-amber-400" },
          { label: "Total XP Available", value: realChallenges.reduce((acc: number, c: any) => acc + (c.xpReward || 0), 0), color: "text-purple-400" },
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Active challenges */}
      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Active Challenges</h2>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((challenge) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard challenge={challenge} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Completed</h2>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((challenge) => (
              <StaggerItem key={challenge.id}>
                <ChallengeCard challenge={challenge} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
    </div>
  );
}
