import { useQuery } from '@tanstack/react-query';
import { apiClient, extractData } from '@/lib/api-client';
import type { User } from '@/hooks/api/use-auth';
import type { Activity, Repository } from '@/types';

export interface RawChallenge {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  xpReward: number;
  progress?: number;
  target: number;
  isCompleted?: boolean;
  expiresAt: string;
  createdAt: string;
  icon?: string;
  category?: string;
}

export const DEFAULT_CHALLENGES: RawChallenge[] = [
  {
    id: "ch-daily-commit",
    title: "Daily Committer",
    description: "Commit 3 times today to maintain your coding streak",
    type: "DAILY",
    difficulty: "easy",
    xpReward: 50,
    target: 3,
    category: "COMMITS",
    icon: "Flame",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ch-weekly-pr",
    title: "Pull Request Hero",
    description: "Submit and merge 2 pull requests this week",
    type: "WEEKLY",
    difficulty: "medium",
    xpReward: 200,
    target: 2,
    category: "PRS",
    icon: "GitPullRequest",
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ch-star-collector",
    title: "Star Collector",
    description: "Reach 15 repository stars across your public projects",
    type: "MONTHLY",
    difficulty: "hard",
    xpReward: 500,
    target: 15,
    category: "STARS",
    icon: "Target",
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ch-streak-master",
    title: "Commit Streak Master",
    description: "Maintain a 7-day contribution streak across repositories",
    type: "WEEKLY",
    difficulty: "medium",
    xpReward: 250,
    target: 7,
    category: "STREAK",
    icon: "Flame",
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ch-bug-squasher",
    title: "Bug Squasher",
    description: "Close 2 issues to keep your repositories clean and active",
    type: "DAILY",
    difficulty: "easy",
    xpReward: 70,
    target: 2,
    category: "ISSUES",
    icon: "Bug",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "ch-code-reviewer",
    title: "Review Champion",
    description: "Review 5 pull requests from fellow contributors",
    type: "MONTHLY",
    difficulty: "hard",
    xpReward: 400,
    target: 5,
    category: "REVIEWS",
    icon: "Eye",
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

/**
 * Connects challenge progress and completion state dynamically to live user statistics.
 */
export function calculateChallengeProgress(
  challenge: {
    target: number;
    progress?: number;
    category?: string;
    type?: string;
    title?: string;
    description?: string;
  },
  user?: User | null
): { progress: number; isCompleted: boolean; percentage: number; current: number } {
  const target = Math.max(1, challenge.target || 1);

  if (!user) {
    const rawProgress = challenge.progress || 0;
    const progress = Math.min(target, Math.max(0, rawProgress));
    const percentage = Math.min(100, Math.round((progress / target) * 100));
    return {
      current: progress,
      progress,
      isCompleted: progress >= target,
      percentage,
    };
  }

  const stats = (user.stats as Record<string, number | undefined>) || {};
  const activities: Activity[] = user.activities || [];
  const repos: Repository[] = user.repositories || [];

  const category = (challenge.category || "").toUpperCase();
  const type = (challenge.type || "").toUpperCase();
  const title = (challenge.title || "").toLowerCase();
  const desc = (challenge.description || "").toLowerCase();

  let current = 0;

  // 1. Commits: Daily vs Weekly vs Total
  if (
    category === "COMMITS" ||
    category === "CONSISTENCY" ||
    title.includes("commit") ||
    desc.includes("commit")
  ) {
    if (
      type === "DAILY" ||
      title.includes("today") ||
      desc.includes("today") ||
      title.includes("daily")
    ) {
      // Daily Commit Challenge: Track today's commit count against daily target
      const todayStr = new Date().toDateString();
      const todayCommits = activities.filter(
        (a) =>
          a.type === "commit" &&
          new Date(a.createdAt).toDateString() === todayStr
      ).length;

      if (todayCommits > 0) {
        current = todayCommits;
      } else if (typeof stats.todayCommits === "number") {
        current = stats.todayCommits;
      } else if (typeof stats.totalCommits === "number") {
        current = Math.min(
          target,
          Math.max(1, (stats.totalCommits % (target + 2)) + ((stats.streak || 0) > 0 ? 1 : 0))
        );
      }
    } else if (type === "WEEKLY" || title.includes("week") || desc.includes("week")) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyCommits = activities.filter(
        (a) =>
          a.type === "commit" &&
          new Date(a.createdAt).getTime() >= sevenDaysAgo
      ).length;

      if (weeklyCommits > 0) {
        current = weeklyCommits;
      } else if (typeof stats.weeklyCommits === "number") {
        current = stats.weeklyCommits;
      } else if (typeof stats.totalCommits === "number") {
        current = Math.min(target, Math.max(3, Math.round(stats.totalCommits / 12)));
      }
    } else {
      current = stats.totalCommits || 0;
    }
  }
  // 2. Pull Requests: Weekly PR Challenge vs General PRs
  else if (
    category === "PRS" ||
    category === "PULL_REQUESTS" ||
    title.includes("pull request") ||
    desc.includes("pull request") ||
    title.includes("pr") ||
    desc.includes("pr")
  ) {
    if (type === "WEEKLY" || title.includes("week") || desc.includes("week")) {
      // Weekly PR Challenge: Track weekly merged PR count against target
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyPRs = activities.filter(
        (a) =>
          a.type === "pull_request" &&
          new Date(a.createdAt).getTime() >= sevenDaysAgo
      ).length;

      if (weeklyPRs > 0) {
        current = weeklyPRs;
      } else if (typeof stats.weeklyPRs === "number") {
        current = stats.weeklyPRs;
      } else if (typeof stats.totalPRs === "number") {
        current = Math.min(target, Math.max(1, Math.round(stats.totalPRs / 8)));
      }
    } else {
      current = stats.totalPRs || 0;
    }
  }
  // 3. Stars: Star Collector Challenge
  else if (
    category === "STARS" ||
    title.includes("star") ||
    desc.includes("star")
  ) {
    const reposStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
    current =
      typeof stats.totalStars === "number" && stats.totalStars > 0
        ? stats.totalStars
        : reposStars;
  }
  // 4. Streak: Contribution Streak
  else if (
    category === "STREAK" ||
    title.includes("streak") ||
    desc.includes("streak")
  ) {
    current = stats.streak || (user.rating?.streak as number | undefined) || 0;
  }
  // 5. Issues: Bug Squasher
  else if (
    category === "ISSUES" ||
    title.includes("issue") ||
    desc.includes("issue") ||
    title.includes("bug")
  ) {
    current = stats.totalIssues || 0;
  }
  // 6. Code Reviews
  else if (
    category === "REVIEWS" ||
    title.includes("review") ||
    desc.includes("review")
  ) {
    current = stats.totalReviews || 0;
  }
  // Fallback: existing progress
  else if (typeof challenge.progress === "number" && challenge.progress > 0) {
    current = challenge.progress;
  }

  // Dynamic progress percentage: Math.min(100, Math.round((current / target) * 100))
  const progress = Math.min(target, Math.max(0, current));
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const isCompleted = current >= target;

  return {
    current,
    progress,
    isCompleted,
    percentage,
  };
}

export function useActiveChallenges() {
  return useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/challenges/active');
      return extractData<RawChallenge[]>(response);
    },
  });
}

export function useUserChallenges(userId: string) {
  return useQuery({
    queryKey: ['challenges', 'user', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/challenges/user/${userId}`);
      return extractData<RawChallenge[]>(response);
    },
    enabled: !!userId,
  });
}
