"use client";

import { motion } from "motion/react";
import { CommitActivityChart } from "@/components/charts/commit-activity-chart";
import { ContributionHeatmap } from "@/components/charts/contribution-heatmap";
import { LanguageDistribution } from "@/components/charts/language-distribution";
import { RepositoryGrowth } from "@/components/charts/repository-growth";
import { RadarCompareChart } from "@/components/charts/radar-compare-chart";
import { GithubWrappedBanner } from "@/components/charts/github-wrapped-banner";
import { RepositoryBubbleChart } from "@/components/charts/repository-bubble-chart";
import { GlobalRankingMeter } from "@/components/charts/global-ranking-meter";
import { StaggerContainer, StaggerItem } from "@/components/animations/page-transition";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { Loader2, BarChart3, TrendingUp, Clock, Calendar, Code, GitCommit } from "lucide-react";

export default function AnalyticsPage() {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return null;

  const stats = (currentUser as any).stats || {};
  const rating = (currentUser as any).rating || {};
  const languages = (currentUser as any).languages || [];
  const repos = (currentUser as any).repositories || [];

  const activeDays = Array.isArray(stats.commitActivity) ? stats.commitActivity.length : 0;
  const avgCommitsPerDay = stats.totalCommits ? (stats.totalCommits / 365) : 0;
  const totalContributions = (stats.totalCommits || 0) + (stats.totalPRs || 0) + (stats.totalIssues || 0);
  let longestStreak = stats.streak || 0;
  
  const monthlyDataMap = new Map<string, number>();
  
  if (Array.isArray(stats.contributionData)) {
    let currentStreak = 0;
    let maxStreak = 0;
    for (const day of stats.contributionData) {
      if (day.count > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      if (day.date) {
        const dateObj = new Date(day.date);
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        monthlyDataMap.set(monthName, (monthlyDataMap.get(monthName) || 0) + day.count);
      }
    }
    if (maxStreak > longestStreak) {
      longestStreak = maxStreak;
    }
  }

  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const repoGrowthData = monthOrder
    .filter(m => monthlyDataMap.has(m))
    .map(m => ({
      month: m,
      value: monthlyDataMap.get(m) || 0
    }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Analytics Hub
            </span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            A comprehensive, Next-Level deep dive into your developer journey.
          </p>
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,_auto)]">
        
        {/* Banner (Full Width) */}
        <StaggerItem className="md:col-span-12">
          <GithubWrappedBanner stats={stats} languages={languages} />
        </StaggerItem>

        {/* Global Ranking (Span 4) */}
        <StaggerItem className="md:col-span-4 min-h-[350px]">
          <GlobalRankingMeter stats={stats} rating={rating} />
        </StaggerItem>

        {/* Radar Chart (Span 8) */}
        <StaggerItem className="md:col-span-8 min-h-[350px]">
          <RadarCompareChart
            developers={[{
              name: currentUser.name || currentUser.username,
              values: [
                stats.totalCommits || 0,
                stats.totalPRs || 0,
                stats.totalIssues || 0,
                stats.totalReviews || 0,
                stats.totalStars || 0,
                longestStreak || 0
              ],
            }]}
          />
        </StaggerItem>

        {/* Quick Stats Bento Row (Full Width, sub-grid) */}
        <StaggerItem className="md:col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: "Avg. Commits/Day", value: avgCommitsPerDay, decimals: 1, icon: GitCommit, color: "text-purple-400" },
            { label: "Active Days", value: activeDays, decimals: 0, icon: Calendar, color: "text-blue-400" },
            { label: "Longest Streak", value: longestStreak, decimals: 0, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Total PRs", value: stats.totalPRs || 0, decimals: 0, icon: Code, color: "text-cyan-400" },
            { label: "Contributions", value: totalContributions, decimals: 0, icon: Clock, color: "text-amber-400" },
            { label: "Growth Score", value: rating.growthScore || 0, decimals: 0, icon: TrendingUp, color: "text-pink-400" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="glass-card rounded-3xl p-6 text-center border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                <div className="text-2xl font-black text-white">
                  <AnimatedCounter value={stat.value} decimals={stat.decimals} />
                </div>
                <div className="text-sm font-medium text-slate-400 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </StaggerItem>

        {/* Repository Bubble Chart (Span 8) */}
        <StaggerItem className="md:col-span-8 min-h-[400px]">
          <RepositoryBubbleChart repos={repos} />
        </StaggerItem>

        {/* Language Distribution (Span 4) */}
        <StaggerItem className="md:col-span-4 min-h-[400px]">
          <div className="h-full glass-card rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />
            <LanguageDistribution data={languages} />
          </div>
        </StaggerItem>

        {/* Commit Activity (Span 12) */}
        <StaggerItem className="md:col-span-12">
          <div className="glass-card rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
            <CommitActivityChart data={stats.commitActivity || []} />
          </div>
        </StaggerItem>

        {/* Heatmap (Span 6) */}
        <StaggerItem className="md:col-span-6 min-h-[300px]">
          <ContributionHeatmap data={stats.contributionData || []} />
        </StaggerItem>

        {/* Repo Growth (Span 6) */}
        <StaggerItem className="md:col-span-6 min-h-[400px]">
          <div className="h-full glass-card rounded-[32px] p-8 border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-colors duration-700" />
             <RepositoryGrowth data={repoGrowthData} />
          </div>
        </StaggerItem>

      </StaggerContainer>
    </div>
  );
}
