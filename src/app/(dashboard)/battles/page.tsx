"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { mockBattles, mockDevelopers } from "@/lib/mock-data";
import { useActiveBattles } from "@/hooks/api/use-battles";
import { Swords, Clock, Trophy, Plus, Flame, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Battle } from "@/types";

export default function BattlesPage() {
  const [tab, setTab] = useState<"active" | "completed" | "create">("active");
  const { data: apiBattles } = useActiveBattles();
  const battlesData = apiBattles || mockBattles;

  const activeBattles = battlesData.filter((b: any) => b.status === "active");
  const completedBattles = battlesData.filter((b: any) => b.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary" />
            Battles
          </h1>
          <p className="text-muted-foreground mt-1">
            Challenge developers and compete head-to-head
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          New Battle
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Battles", value: activeBattles.length, icon: Swords, color: "text-blue-400" },
          { label: "Victories", value: 12, icon: Trophy, color: "text-amber-400" },
          { label: "Win Rate", value: "67%", icon: Flame, color: "text-orange-400" },
          { label: "Battle XP", value: "4,500", icon: Zap, color: "text-purple-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-[16px] p-4 text-center"
            >
              <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "active" as const, label: "Active", count: activeBattles.length },
          { id: "completed" as const, label: "Completed", count: completedBattles.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Battle Cards */}
      <StaggerContainer className="space-y-4">
        {(tab === "active" ? activeBattles : completedBattles).map((battle) => (
          <StaggerItem key={battle.id}>
            <BattleCard battle={battle} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {(tab === "active" ? activeBattles : completedBattles).length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-[20px] p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Swords className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No {tab} battles</h3>
          <p className="text-sm text-muted-foreground">
            {tab === "active" ? "Start a new battle to compete!" : "Complete some battles to see them here."}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function BattleCard({ battle }: { battle: Battle }) {
  const isActive = battle.status === "active";
  const challenger = battle.challenger;
  const opponent = battle.opponent;
  const challengerLeading = challenger.score >= opponent.score;

  const getTimeRemaining = () => {
    if (!battle.endsAt) return "";
    const end = new Date(battle.endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.005, y: -2 }}
      className={cn(
        "glass-card rounded-[24px] p-6 cursor-pointer",
        isActive && "border border-primary/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{battle.category}</span>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {getTimeRemaining()}
            </span>
          )}
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-lg font-medium",
            isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted-foreground"
          )}>
            {isActive ? "Live" : "Completed"}
          </span>
        </div>
      </div>

      {/* VS Section */}
      <div className="flex items-center justify-between gap-4">
        {/* Challenger */}
        <div className={cn("flex-1 text-center", challengerLeading && isActive && "")}>
          <img src={challenger.avatar} alt={challenger.name} className="w-16 h-16 rounded-2xl mx-auto mb-2 border-2 border-white/10" />
          <div className="text-sm font-semibold">{challenger.name}</div>
          <div className="text-2xl font-bold mt-1 gradient-text">
            <AnimatedCounter value={challenger.score} />
          </div>
          {challenger.stats && (
            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{challenger.stats.commits} commits</span>
              <span>{challenger.stats.prs} PRs</span>
            </div>
          )}
          {battle.winner === challenger.id && (
            <div className="mt-2">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Winner 🏆</span>
            </div>
          )}
        </div>

        {/* VS */}
        <div className="shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">VS</span>
          </div>
        </div>

        {/* Opponent */}
        <div className={cn("flex-1 text-center", !challengerLeading && isActive && "")}>
          <img src={opponent.avatar} alt={opponent.name} className="w-16 h-16 rounded-2xl mx-auto mb-2 border-2 border-white/10" />
          <div className="text-sm font-semibold">{opponent.name}</div>
          <div className="text-2xl font-bold mt-1 gradient-text">
            <AnimatedCounter value={opponent.score} />
          </div>
          {opponent.stats && (
            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{opponent.stats.commits} commits</span>
              <span>{opponent.stats.prs} PRs</span>
            </div>
          )}
          {battle.winner === opponent.id && (
            <div className="mt-2">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Winner 🏆</span>
            </div>
          )}
        </div>
      </div>

      {/* Score bar */}
      {isActive && (
        <div className="mt-5">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(challenger.score / (challenger.score + opponent.score)) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-l-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(opponent.score / (challenger.score + opponent.score)) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-r-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
