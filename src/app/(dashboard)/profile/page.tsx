"use client";

import { motion } from "motion/react";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AnimatedCounter, AnimatedProgress } from "@/components/animations/animated-counter";
import { ContributionHeatmap } from "@/components/charts/contribution-heatmap";
import { LanguageDistribution } from "@/components/charts/language-distribution";
import { ActivityTimeline } from "@/components/data-display/activity-timeline";
import { mockCurrentUser, mockRepositories, mockActivities } from "@/lib/mock-data";
import { TIER_COLORS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import {
  MapPin, Building, Globe, Calendar, Star, GitFork, Users, GitCommit,
  GitPullRequest, Eye, Flame, Code, ExternalLink, Crown,
} from "lucide-react";

export default function ProfilePage() {
  const user = mockCurrentUser;
  const tierStyle = TIER_COLORS[user.rating.tier];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[24px] p-8 relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />

        <div className="relative flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 rounded-3xl border-2 border-white/10"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-[#111827]" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <span className={`text-xs px-3 py-1 rounded-lg bg-gradient-to-r ${tierStyle.bg} text-white font-bold flex items-center gap-1`}>
                <Crown className="w-3 h-3" />
                {user.rating.tier}
              </span>
            </div>
            <p className="text-muted-foreground mb-1">@{user.username}</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xl">{user.bio}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{user.location}</span>
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{user.company}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{user.website}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {user.joinedAt}</span>
            </div>

            {/* Followers/Following */}
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm"><strong>{formatNumber(user.stats.followers)}</strong> <span className="text-muted-foreground">followers</span></span>
              <span className="text-sm"><strong>{formatNumber(user.stats.following)}</strong> <span className="text-muted-foreground">following</span></span>
            </div>
          </div>

          {/* Rating + XP */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl font-bold gradient-text">
              <AnimatedCounter value={user.rating.overall} decimals={1} />
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium">Level {user.rating.level}</div>
              <AnimatedProgress
                value={user.rating.xp}
                max={user.rating.xpToNextLevel}
                size="sm"
                className="w-32 mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(user.rating.xp)} / {formatNumber(user.rating.xpToNextLevel)} XP
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Commits", value: user.stats.totalCommits, icon: GitCommit, color: "text-purple-400" },
          { label: "PRs", value: user.stats.totalPRs, icon: GitPullRequest, color: "text-blue-400" },
          { label: "Reviews", value: user.stats.totalReviews, icon: Eye, color: "text-cyan-400" },
          { label: "Stars", value: user.stats.totalStars, icon: Star, color: "text-amber-400" },
          { label: "Streak", value: user.stats.streak, icon: Flame, color: "text-orange-400" },
          { label: "Repos", value: user.stats.totalRepos, icon: Code, color: "text-emerald-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <StaggerItem key={stat.label}>
              <div className="glass-card rounded-[16px] p-4 text-center">
                <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <div className="text-xl font-bold"><AnimatedCounter value={stat.value} /></div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Badges */}
      <div className="glass-card rounded-[20px] p-6">
        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-3">
          {user.badges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-lg">🏆</span>
              <div>
                <div className="text-sm font-medium">{badge.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{badge.tier}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Heatmap + Language */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContributionHeatmap />
        </div>
        <LanguageDistribution />
      </div>

      {/* Pinned Repos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pinned Repositories</h2>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRepositories.slice(0, 4).map((repo) => (
            <StaggerItem key={repo.id}>
              <motion.div
                whileHover={{ scale: 1.01, y: -2 }}
                className="glass-card rounded-[20px] p-5 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {repo.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{repo.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: repo.languageColor }} />
                    {repo.language}
                  </span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{formatNumber(repo.stars)}</span>
                  <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{formatNumber(repo.forks)}</span>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Recent Activity */}
      <ActivityTimeline activities={mockActivities} maxItems={6} />
    </div>
  );
}
