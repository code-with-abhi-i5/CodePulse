"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AchievementCard } from "@/components/cards/achievement-card";
import { AchievementDetailModal } from "@/components/modals/achievement-detail-modal";
import { useCurrentUser } from "@/hooks/api/use-auth";
import {
  Award,
  Lock,
  Unlock,
  Filter,
  Loader2,
  Search,
  X,
  Zap,
  Sparkles,
} from "lucide-react";
import type { Achievement } from "@/types";

const categories = [
  "All",
  "Milestones",
  "Popularity",
  "Dedication",
  "Consistency",
  "Diversity",
  "Social",
];

const rarities = [
  { id: "all", label: "All Rarities" },
  { id: "common", label: "Common" },
  { id: "rare", label: "Rare" },
  { id: "epic", label: "Epic" },
  { id: "legendary", label: "Legendary" },
];

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilter, setShowFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-44 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-[20px] p-5 h-40 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-white/5 rounded" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-2 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-slate-400">Loading achievements...</p>
      </div>
    );
  }

  const achievements: Achievement[] = (currentUser as any).achievements || [];

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const totalXpEarned = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + (a.xpReward || 0), 0);

  // Apply filters: category, status, rarity, and search
  const filtered = achievements.filter((a) => {
    if (activeCategory !== "All" && a.category !== activeCategory) {
      return false;
    }
    if (showFilter === "unlocked" && !a.isUnlocked) {
      return false;
    }
    if (showFilter === "locked" && a.isUnlocked) {
      return false;
    }
    if (selectedRarity !== "all" && a.rarity !== selectedRarity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = a.title.toLowerCase().includes(q);
      const matchesDesc = a.description.toLowerCase().includes(q);
      const matchesCategory = a.category.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc && !matchesCategory) {
        return false;
      }
    }
    return true;
  });

  const handleCardClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            {unlockedCount}/{totalCount} unlocked ({completionPercentage}%) • {totalXpEarned} XP earned
          </p>
        </div>

        {/* Lock/Unlock Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "all" as const, label: "All", icon: Filter },
            { id: "unlocked" as const, label: "Unlocked", icon: Unlock },
            { id: "locked" as const, label: "Locked", icon: Lock },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setShowFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  showFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-[18px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold">{completionPercentage}%</div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </div>
        </div>

        <div className="glass-card rounded-[18px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold">+{totalXpEarned} XP</div>
            <div className="text-xs text-muted-foreground">Total XP Earned</div>
          </div>
        </div>

        <div className="glass-card rounded-[18px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold">
              {unlockedCount} / {totalCount}
            </div>
            <div className="text-xs text-muted-foreground">Milestones Completed</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements by name, criteria, or category..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rarity filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {rarities.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRarity(r.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRarity === r.id
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/20"
                : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((achievement) => (
          <StaggerItem key={achievement.id}>
            <AchievementCard
              achievement={achievement}
              onClick={() => handleCardClick(achievement)}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-[20px] p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search query, rarity filter, or category.
          </p>
          {(searchQuery || selectedRarity !== "all" || showFilter !== "all" || activeCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRarity("all");
                setShowFilter("all");
                setActiveCategory("All");
              }}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      )}

      {/* Detail & Share Modal */}
      <AchievementDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAchievement(null);
        }}
        achievement={selectedAchievement}
      />
    </div>
  );
}
