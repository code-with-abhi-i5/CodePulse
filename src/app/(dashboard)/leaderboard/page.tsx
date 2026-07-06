"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { mockDevelopers, mockLeaderboard } from "@/lib/mock-data";
import { useGlobalLeaderboard } from "@/hooks/api/use-leaderboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, ChevronUp, ChevronDown, Minus, Crown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardCategory } from "@/types";

const tabs: { id: LeaderboardCategory; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "country", label: "Country" },
  { id: "friends", label: "Friends" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>("global");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: globalLeaderboard } = useGlobalLeaderboard(50);

  // Generate extended leaderboard data
  const apiEntries = globalLeaderboard?.map((item: any, index: number) => ({
    rank: index + 1,
    previousRank: index + 1 + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
    developer: {
      id: item.user.id,
      name: item.user.name || item.user.username,
      username: item.user.username,
      avatar: item.user.avatar || '',
      isOnline: false,
      rating: item
    },
    score: Math.floor(item.overall * 1000),
    change: Math.floor(Math.random() * 200) - 100,
  }));

  const mockEntries = mockDevelopers
    .sort((a, b) => a.rating.rank - b.rating.rank)
    .map((dev, index) => ({
      rank: index + 1,
      previousRank: index + 1 + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
      developer: dev,
      score: Math.floor(dev.rating.overall * 1000),
      change: Math.floor(Math.random() * 200) - 100,
    }));

  const entries = apiEntries || mockEntries;

  const filtered = searchQuery
    ? entries.filter((e) =>
        e.developer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.developer.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            See how you rank against developers worldwide
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardCategory)}>
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      {filtered.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[filtered[1], filtered[0], filtered[2]].map((entry, i) => {
            const podiumOrder = [2, 1, 3];
            const rank = podiumOrder[i];
            const heights = ["h-32", "h-40", "h-28"];
            const colors = [
              "from-gray-400 to-gray-500",
              "from-amber-400 to-yellow-500",
              "from-amber-700 to-amber-800",
            ];
            const labels = ["Silver", "Gold", "Bronze"];

            return (
              <motion.div
                key={entry.developer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-3">
                  <img
                    src={entry.developer.avatar}
                    alt={entry.developer.name}
                    className="w-16 h-16 rounded-full border-2 border-white/10"
                  />
                  {rank === 1 && (
                    <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div className="text-sm font-semibold text-center mb-1">
                  {entry.developer.name.split(" ")[0]}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <AnimatedCounter value={entry.score} /> pts
                </div>
                <div
                  className={cn(
                    `w-full ${heights[i]} rounded-t-2xl bg-gradient-to-b flex items-start justify-center pt-3`,
                    colors[i]
                  )}
                >
                  <span className="text-2xl font-bold text-white/90">#{rank}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard List */}
      <StaggerContainer className="space-y-2">
        {filtered.map((entry) => {
          const rankChange = entry.previousRank - entry.rank;
          return (
            <StaggerItem key={entry.developer.id}>
              <motion.div
                whileHover={{ scale: 1.005, x: 4 }}
                className="glass-card rounded-[16px] p-4 flex items-center gap-4 cursor-pointer"
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  {entry.rank <= 3 ? (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold text-white",
                        entry.rank === 1 && "bg-gradient-to-br from-amber-400 to-yellow-500",
                        entry.rank === 2 && "bg-gradient-to-br from-gray-400 to-gray-500",
                        entry.rank === 3 && "bg-gradient-to-br from-amber-700 to-amber-800"
                      )}
                    >
                      {entry.rank}
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Rank Change */}
                <div className="w-8">
                  {rankChange > 0 && (
                    <span className="flex items-center text-emerald-400 text-xs">
                      <ChevronUp className="w-3.5 h-3.5" />
                      {rankChange}
                    </span>
                  )}
                  {rankChange < 0 && (
                    <span className="flex items-center text-red-400 text-xs">
                      <ChevronDown className="w-3.5 h-3.5" />
                      {Math.abs(rankChange)}
                    </span>
                  )}
                  {rankChange === 0 && (
                    <Minus className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                  )}
                </div>

                {/* Developer info */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <img
                      src={entry.developer.avatar}
                      alt={entry.developer.name}
                      className="w-10 h-10 rounded-full"
                    />
                    {entry.developer.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#111827]" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{entry.developer.name}</div>
                    <div className="text-xs text-muted-foreground">@{entry.developer.username}</div>
                  </div>
                </div>

                {/* Tier badge */}
                <div className="hidden sm:block">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                    {entry.developer.rating.tier}
                  </span>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-sm font-bold">
                    <AnimatedCounter value={entry.score} />
                  </div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
