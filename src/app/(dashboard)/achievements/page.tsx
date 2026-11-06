"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AchievementCard } from "@/components/cards/achievement-card";
import { AchievementShareModal } from "@/components/modals/achievement-share-modal";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { Award, Lock, Unlock, Filter, Loader2 } from "lucide-react";
import type { Achievement } from "@/types";

const categories = ["All", "Milestones", "Popularity", "Dedication", "Consistency", "Diversity", "Social"];

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilter, setShowFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: currentUser, isLoading } = useCurrentUser();

  const handleOpenAchievementModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsShareModalOpen(true);
  };

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

  const achievements = (currentUser as any).achievements || [];

  let filtered = activeCategory === "All"
    ? achievements
    : achievements.filter((a: any) => a.category === activeCategory);

  if (showFilter === "unlocked") filtered = filtered.filter((a: any) => a.isUnlocked);
  if (showFilter === "locked") filtered = filtered.filter((a: any) => !a.isUnlocked);

  const unlockedCount = achievements.filter((a: any) => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            {unlockedCount}/{achievements.length} achievements unlocked
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((achievement: any) => (
          <StaggerItem key={achievement.id}>
            <AchievementCard
              achievement={achievement}
              onClick={() => handleOpenAchievementModal(achievement)}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

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
          <p className="text-sm text-muted-foreground">Try a different category or filter.</p>
        </motion.div>
      )}

      {/* Interactive Achievement Share Celebration Modal */}
      <AchievementShareModal
        achievement={selectedAchievement}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
