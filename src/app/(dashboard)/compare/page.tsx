"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { RadarCompareChart } from "@/components/charts/radar-compare-chart";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { useGlobalLeaderboard } from "@/hooks/api/use-leaderboard";
import { Trophy, Crown, X, Plus, GitCompareArrows, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const comparisonCategories = [
  { key: "totalCommits", label: "Commits", icon: "💻" },
  { key: "totalPRs", label: "Pull Requests", icon: "🔀" },
  { key: "totalIssues", label: "Issues", icon: "🐛" },
  { key: "totalStars", label: "Stars", icon: "⭐" },
  { key: "followers", label: "Followers", icon: "👥" },
  { key: "streak", label: "Streak", icon: "🔥" },
];

export default function ComparePage() {
  const { data: currentUser, isLoading: loadingUser } = useCurrentUser();
  const { data: leaderboardDevs, isLoading: loadingLeaderboard } = useGlobalLeaderboard(10);
  
  const [selectedDevs, setSelectedDevs] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Initialize selected devs once data is loaded
  useEffect(() => {
    if (currentUser && selectedDevs.length === 0) {
      const initialDevs = [currentUser];
      if (leaderboardDevs && leaderboardDevs.length > 0) {
        // Find top dev that is not the current user
        const topDev = leaderboardDevs.find(d => d.id !== currentUser.id);
        if (topDev) initialDevs.push(topDev);
      }
      setSelectedDevs(initialDevs);
    }
  }, [currentUser, leaderboardDevs, selectedDevs.length]);

  if (loadingUser || loadingLeaderboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Combine currentUser and leaderboardDevs for available search
  const allDevsMap = new Map();
  if (currentUser) allDevsMap.set(currentUser.id, currentUser);
  if (leaderboardDevs) {
    leaderboardDevs.forEach(d => allDevsMap.set(d.id, d));
  }
  const allDevs = Array.from(allDevsMap.values());

  const availableDevs = allDevs.filter(
    (d) => !selectedDevs.find((s) => s.id === d.id)
  );

  const getWinner = (key: string): string | null => {
    if (selectedDevs.length < 2) return null;
    let maxVal = -1;
    let winnerId = "";
    selectedDevs.forEach((dev) => {
      const val = dev.stats?.[key as keyof typeof dev.stats] || 0;
      if (val > maxVal) {
        maxVal = val;
        winnerId = dev.id;
      }
    });
    return winnerId;
  };

  const overallWinner = (): any | null => {
    if (selectedDevs.length < 2) return null;
    const scores: Record<string, number> = {};
    selectedDevs.forEach((d) => (scores[d.id] = 0));
    comparisonCategories.forEach((cat) => {
      const winner = getWinner(cat.key);
      if (winner) scores[winner]++;
    });
    const maxScore = Math.max(...Object.values(scores));
    const winnerId = Object.entries(scores).find(([, s]) => s === maxScore)?.[0];
    return selectedDevs.find((d) => d.id === winnerId) || null;
  };

  const winner = overallWinner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitCompareArrows className="w-6 h-6 text-primary" />
          Developer Compare
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare developer stats side by side
        </p>
      </div>

      {/* Selected developers */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedDevs.map((dev) => (
          <motion.div
            key={dev.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
          >
            <img
              src={dev.avatar}
              alt={dev.name || dev.username}
              className="w-7 h-7 rounded-full"
            />
            <span className="text-sm font-medium">{dev.name || dev.username}</span>
            {selectedDevs.length > 1 && (
              <button
                onClick={() => setSelectedDevs(selectedDevs.filter((d) => d.id !== dev.id))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
        {selectedDevs.length < 5 && availableDevs.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-dashed border-white/20 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Developer
            </button>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-64 glass-card rounded-xl p-2 z-50"
              >
                {availableDevs.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => {
                      setSelectedDevs([...selectedDevs, dev]);
                      setSearchOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <img src={dev.avatar} alt={dev.name || dev.username} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="text-sm font-medium">{dev.name || dev.username}</div>
                      <div className="text-xs text-muted-foreground">@{dev.username}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Overall Winner Card */}
      {winner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[24px] p-6 border border-amber-500/20 glow-purple"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-400 font-medium mb-1">
                Overall Winner
              </div>
              <div className="flex items-center gap-3">
                <img src={winner.avatar} alt={winner.name || winner.username} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="text-lg font-bold">{winner.name || winner.username}</div>
                  <div className="text-sm text-muted-foreground">
                    Rating: {winner.rating?.overall || 0} · {winner.rating?.tier || "BRONZE"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedDevs.length > 0 && (
        <>
          {/* Radar Chart */}
          <RadarCompareChart
            developers={selectedDevs.map((dev) => ({
              name: dev.name || dev.username,
              values: [
                dev.stats?.totalCommits || 0,
                dev.stats?.totalPRs || 0,
                dev.stats?.totalIssues || 0,
                dev.stats?.totalReviews || 0,
                dev.stats?.totalStars || 0,
                dev.stats?.streak || 0,
              ],
            }))}
          />

          {/* Comparison Table */}
          <StaggerContainer className="space-y-3">
            {comparisonCategories.map((cat) => {
              const winnerId = getWinner(cat.key);
              return (
                <StaggerItem key={cat.key}>
                  <div className="glass-card rounded-[20px] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedDevs.length}, 1fr)` }}>
                      {selectedDevs.map((dev) => {
                        const val = dev.stats?.[cat.key as keyof typeof dev.stats] || 0;
                        const isWinner = dev.id === winnerId && selectedDevs.length > 1 && val > 0;
                        return (
                          <div
                            key={dev.id}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                              isWinner ? "bg-primary/10 border border-primary/20" : "bg-white/[0.03]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <img src={dev.avatar} alt={dev.name || dev.username} className="w-6 h-6 rounded-full" />
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {(dev.name || dev.username).split(" ")[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AnimatedCounter value={val} className="text-sm font-bold" />
                              {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </>
      )}
    </div>
  );
}
