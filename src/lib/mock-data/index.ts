import type {
  Developer,
  DeveloperRating,
  DeveloperStats,
  Repository,
  LanguageStat,
  Challenge,
  Achievement,
  Badge,
  Battle,
  BattleParticipant,
  LeaderboardEntry,
  Notification,
  Activity,
  ContributionDay,
  CommitActivity,
} from "@/types";
import { LANGUAGE_COLORS } from "@/lib/constants";

// ===========================
// Mock Developers
// ===========================

function createRating(overrides: Partial<DeveloperRating> = {}): DeveloperRating {
  return {
    overall: 8.7,
    level: 42,
    xp: 84200,
    xpToNextLevel: 100000,
    rank: 156,
    totalDevelopers: 250000,
    tier: "Diamond",
    growthScore: 92,
    ...overrides,
  };
}

function createStats(overrides: Partial<DeveloperStats> = {}): DeveloperStats {
  return {
    totalCommits: 12847,
    totalPRs: 834,
    totalIssues: 423,
    totalReviews: 1256,
    totalStars: 4892,
    totalForks: 1203,
    totalRepos: 87,
    followers: 2341,
    following: 186,
    contributions: 18453,
    streak: 47,
    longestStreak: 182,
    avgCommitsPerDay: 8.3,
    activeDays: 312,
    ...overrides,
  };
}

export const mockCurrentUser: Developer = {
  id: "user-1",
  username: "alexchen",
  name: "Alex Chen",
  avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=alexchen",
  bio: "Full-stack developer passionate about open source, distributed systems, and developer tools.",
  location: "San Francisco, CA",
  company: "TechCorp",
  website: "https://alexchen.dev",
  githubUrl: "https://github.com/alexchen",
  joinedAt: "2019-03-15",
  isOnline: true,
  rating: createRating(),
  stats: createStats(),
  languages: createLanguages(),
  badges: createBadges(),
  achievements: createAchievements(),
  pinnedRepos: [],
};

export const mockDevelopers: Developer[] = [
  mockCurrentUser,
  {
    id: "user-2",
    username: "sarahdev",
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=sarahdev",
    bio: "Backend engineer. Rust enthusiast. Building the future of web infrastructure.",
    location: "London, UK",
    company: "CloudScale",
    website: "https://sarah.dev",
    githubUrl: "https://github.com/sarahdev",
    joinedAt: "2018-07-22",
    isOnline: true,
    rating: createRating({ overall: 9.2, level: 56, xp: 112000, rank: 42, tier: "Master" }),
    stats: createStats({ totalCommits: 18234, totalPRs: 1247, totalStars: 8923, streak: 92 }),
    languages: createLanguages(),
    badges: createBadges(),
    achievements: createAchievements(),
    pinnedRepos: [],
  },
  {
    id: "user-3",
    username: "mikerust",
    name: "Mike Thompson",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=mikerust",
    bio: "Systems programmer. Contributing to open source since 2015.",
    location: "Berlin, Germany",
    company: "OpenSys",
    website: "https://mikethompson.dev",
    githubUrl: "https://github.com/mikerust",
    joinedAt: "2015-01-10",
    isOnline: false,
    rating: createRating({ overall: 9.5, level: 67, xp: 156000, rank: 12, tier: "Grandmaster" }),
    stats: createStats({ totalCommits: 28456, totalPRs: 2134, totalStars: 15678, streak: 234 }),
    languages: createLanguages(),
    badges: createBadges(),
    achievements: createAchievements(),
    pinnedRepos: [],
  },
  {
    id: "user-4",
    username: "emmapy",
    name: "Emma Williams",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=emmapy",
    bio: "ML Engineer & Python advocate. Making AI accessible to everyone.",
    location: "Toronto, Canada",
    company: "AI Labs",
    website: "https://emma.codes",
    githubUrl: "https://github.com/emmapy",
    joinedAt: "2020-05-18",
    isOnline: true,
    rating: createRating({ overall: 8.1, level: 35, xp: 62000, rank: 312, tier: "Platinum" }),
    stats: createStats({ totalCommits: 8923, totalPRs: 512, totalStars: 3456, streak: 28 }),
    languages: createLanguages(),
    badges: createBadges(),
    achievements: createAchievements(),
    pinnedRepos: [],
  },
  {
    id: "user-5",
    username: "jamesgo",
    name: "James Park",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=jamesgo",
    bio: "Go developer building cloud-native infrastructure. Kubernetes contributor.",
    location: "Seoul, South Korea",
    company: "CloudNative Inc",
    website: "https://jamespark.dev",
    githubUrl: "https://github.com/jamesgo",
    joinedAt: "2017-11-03",
    isOnline: false,
    rating: createRating({ overall: 8.9, level: 48, xp: 95000, rank: 89, tier: "Diamond" }),
    stats: createStats({ totalCommits: 15234, totalPRs: 987, totalStars: 6789, streak: 65 }),
    languages: createLanguages(),
    badges: createBadges(),
    achievements: createAchievements(),
    pinnedRepos: [],
  },
];

// ===========================
// Languages
// ===========================

function createLanguages(): LanguageStat[] {
  return [
    { name: "TypeScript", color: LANGUAGE_COLORS["TypeScript"], percentage: 38, linesOfCode: 245000, repos: 34 },
    { name: "Python", color: LANGUAGE_COLORS["Python"], percentage: 22, linesOfCode: 142000, repos: 18 },
    { name: "Rust", color: LANGUAGE_COLORS["Rust"], percentage: 15, linesOfCode: 97000, repos: 8 },
    { name: "Go", color: LANGUAGE_COLORS["Go"], percentage: 12, linesOfCode: 78000, repos: 11 },
    { name: "JavaScript", color: LANGUAGE_COLORS["JavaScript"], percentage: 8, linesOfCode: 52000, repos: 22 },
    { name: "Shell", color: LANGUAGE_COLORS["Shell"], percentage: 3, linesOfCode: 19000, repos: 15 },
    { name: "CSS", color: LANGUAGE_COLORS["CSS"], percentage: 2, linesOfCode: 13000, repos: 12 },
  ];
}

// ===========================
// Repositories
// ===========================

export const mockRepositories: Repository[] = [
  {
    id: "repo-1",
    name: "devbattle-engine",
    fullName: "alexchen/devbattle-engine",
    description: "High-performance analytics engine for GitHub developer metrics. Built with Rust and WebAssembly.",
    language: "Rust",
    languageColor: LANGUAGE_COLORS["Rust"],
    stars: 2847,
    forks: 423,
    watchers: 156,
    issues: 23,
    pullRequests: 8,
    commits: 1234,
    contributors: 42,
    size: 15400,
    createdAt: "2023-01-15",
    updatedAt: "2024-12-28",
    topics: ["rust", "analytics", "wasm", "performance"],
    isPrivate: false,
    url: "https://github.com/alexchen/devbattle-engine",
  },
  {
    id: "repo-2",
    name: "neural-search",
    fullName: "alexchen/neural-search",
    description: "Semantic code search powered by transformer models. Find code by meaning, not keywords.",
    language: "Python",
    languageColor: LANGUAGE_COLORS["Python"],
    stars: 1523,
    forks: 234,
    watchers: 89,
    issues: 12,
    pullRequests: 5,
    commits: 867,
    contributors: 28,
    size: 8900,
    createdAt: "2023-06-20",
    updatedAt: "2024-12-25",
    topics: ["python", "ml", "search", "transformers"],
    isPrivate: false,
    url: "https://github.com/alexchen/neural-search",
  },
  {
    id: "repo-3",
    name: "cloud-deploy",
    fullName: "alexchen/cloud-deploy",
    description: "Zero-config deployment tool for modern web applications. Deploy to any cloud provider.",
    language: "Go",
    languageColor: LANGUAGE_COLORS["Go"],
    stars: 987,
    forks: 156,
    watchers: 67,
    issues: 8,
    pullRequests: 3,
    commits: 543,
    contributors: 19,
    size: 5600,
    createdAt: "2023-09-10",
    updatedAt: "2024-12-20",
    topics: ["go", "devops", "cloud", "deployment"],
    isPrivate: false,
    url: "https://github.com/alexchen/cloud-deploy",
  },
  {
    id: "repo-4",
    name: "ui-components",
    fullName: "alexchen/ui-components",
    description: "A beautiful, accessible React component library with dark mode and animations.",
    language: "TypeScript",
    languageColor: LANGUAGE_COLORS["TypeScript"],
    stars: 756,
    forks: 98,
    watchers: 45,
    issues: 5,
    pullRequests: 2,
    commits: 412,
    contributors: 15,
    size: 3200,
    createdAt: "2024-02-14",
    updatedAt: "2024-12-27",
    topics: ["react", "typescript", "ui", "components", "dark-mode"],
    isPrivate: false,
    url: "https://github.com/alexchen/ui-components",
  },
  {
    id: "repo-5",
    name: "api-gateway",
    fullName: "alexchen/api-gateway",
    description: "Lightweight, high-performance API gateway with built-in rate limiting and auth.",
    language: "TypeScript",
    languageColor: LANGUAGE_COLORS["TypeScript"],
    stars: 534,
    forks: 67,
    watchers: 34,
    issues: 3,
    pullRequests: 1,
    commits: 289,
    contributors: 8,
    size: 2100,
    createdAt: "2024-05-01",
    updatedAt: "2024-12-22",
    topics: ["typescript", "api", "gateway", "microservices"],
    isPrivate: false,
    url: "https://github.com/alexchen/api-gateway",
  },
  {
    id: "repo-6",
    name: "dotfiles",
    fullName: "alexchen/dotfiles",
    description: "My development environment setup. Neovim, Tmux, Zsh, and more.",
    language: "Shell",
    languageColor: LANGUAGE_COLORS["Shell"],
    stars: 312,
    forks: 89,
    watchers: 23,
    issues: 1,
    pullRequests: 0,
    commits: 678,
    contributors: 3,
    size: 450,
    createdAt: "2019-03-20",
    updatedAt: "2024-12-26",
    topics: ["dotfiles", "neovim", "tmux", "zsh"],
    isPrivate: false,
    url: "https://github.com/alexchen/dotfiles",
  },
];

// ===========================
// Challenges
// ===========================

export const mockChallenges: Challenge[] = [
  {
    id: "ch-1",
    title: "Commit Streak Master",
    description: "Maintain a 7-day commit streak across any repository",
    type: "weekly",
    difficulty: "medium",
    xpReward: 500,
    progress: 5,
    target: 7,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "Flame",
    category: "Consistency",
  },
  {
    id: "ch-2",
    title: "Pull Request Hero",
    description: "Submit 3 pull requests that get merged today",
    type: "daily",
    difficulty: "hard",
    xpReward: 300,
    progress: 1,
    target: 3,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    icon: "GitPullRequest",
    category: "Collaboration",
  },
  {
    id: "ch-3",
    title: "Code Reviewer",
    description: "Review 10 pull requests this week with detailed feedback",
    type: "weekly",
    difficulty: "medium",
    xpReward: 450,
    progress: 7,
    target: 10,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "Eye",
    category: "Quality",
  },
  {
    id: "ch-4",
    title: "Open Source Champion",
    description: "Contribute to 5 different open source projects this month",
    type: "monthly",
    difficulty: "legendary",
    xpReward: 2000,
    progress: 3,
    target: 5,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "Globe",
    category: "Open Source",
  },
  {
    id: "ch-5",
    title: "Daily Commit",
    description: "Make at least 1 commit today",
    type: "daily",
    difficulty: "easy",
    xpReward: 50,
    progress: 1,
    target: 1,
    isCompleted: true,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    icon: "Check",
    category: "Consistency",
  },
  {
    id: "ch-6",
    title: "Bug Squasher",
    description: "Close 20 issues this month",
    type: "monthly",
    difficulty: "hard",
    xpReward: 1500,
    progress: 14,
    target: 20,
    isCompleted: false,
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "Bug",
    category: "Quality",
  },
];

// ===========================
// Achievements & Badges
// ===========================

function createAchievements(): Achievement[] {
  return [
    { id: "ach-1", title: "First Commit", description: "Make your first commit on GitHub", icon: "GitCommit", category: "Milestones", rarity: "common", isUnlocked: true, unlockedAt: "2019-03-15", progress: 1, target: 1, xpReward: 100 },
    { id: "ach-2", title: "1K Stars", description: "Get 1,000 total stars across all repositories", icon: "Star", category: "Popularity", rarity: "rare", isUnlocked: true, unlockedAt: "2023-08-20", progress: 4892, target: 1000, xpReward: 1000 },
    { id: "ach-3", title: "10K Commits", description: "Reach 10,000 total commits", icon: "GitCommit", category: "Dedication", rarity: "epic", isUnlocked: true, unlockedAt: "2024-06-15", progress: 12847, target: 10000, xpReward: 2500 },
    { id: "ach-4", title: "100-Day Streak", description: "Maintain a 100-day commit streak", icon: "Flame", category: "Consistency", rarity: "epic", isUnlocked: false, progress: 47, target: 100, xpReward: 3000 },
    { id: "ach-5", title: "Polyglot", description: "Use 10 different programming languages", icon: "Languages", category: "Diversity", rarity: "rare", isUnlocked: true, unlockedAt: "2024-01-10", progress: 12, target: 10, xpReward: 800 },
    { id: "ach-6", title: "Community Leader", description: "Get 5,000 followers", icon: "Users", category: "Social", rarity: "legendary", isUnlocked: false, progress: 2341, target: 5000, xpReward: 5000 },
  ];
}

function createBadges(): Badge[] {
  return [
    { id: "b-1", name: "Early Adopter", description: "Joined DevBattle in its first year", icon: "Rocket", tier: "gold", earnedAt: "2023-01-15", category: "Special" },
    { id: "b-2", name: "Top Contributor", description: "Ranked in the top 1% of contributors", icon: "Award", tier: "diamond", earnedAt: "2024-06-20", category: "Achievement" },
    { id: "b-3", name: "Bug Hunter", description: "Reported and fixed 50+ bugs", icon: "Bug", tier: "platinum", earnedAt: "2024-03-10", category: "Quality" },
    { id: "b-4", name: "Team Player", description: "Reviewed 100+ pull requests", icon: "Users", tier: "gold", earnedAt: "2024-01-05", category: "Collaboration" },
    { id: "b-5", name: "Speed Demon", description: "Completed 10 challenges in one week", icon: "Zap", tier: "silver", earnedAt: "2024-08-15", category: "Challenge" },
  ];
}

// ===========================
// Battles
// ===========================

export const mockBattles: Battle[] = [
  {
    id: "battle-1",
    challenger: { id: "user-1", username: "alexchen", name: "Alex Chen", avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=alexchen", score: 8750, stats: { commits: 234, prs: 18, reviews: 45 } },
    opponent: { id: "user-2", username: "sarahdev", name: "Sarah Johnson", avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=sarahdev", score: 9200, stats: { commits: 267, prs: 23, reviews: 52 } },
    status: "active",
    category: "Overall Performance",
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "battle-2",
    challenger: { id: "user-1", username: "alexchen", name: "Alex Chen", avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=alexchen", score: 156, stats: { commits: 156, prs: 0, reviews: 0 } },
    opponent: { id: "user-5", username: "jamesgo", name: "James Park", avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=jamesgo", score: 142, stats: { commits: 142, prs: 0, reviews: 0 } },
    status: "completed",
    category: "Commit Sprint",
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    winner: "user-1",
  },
];

// ===========================
// Leaderboard
// ===========================

export const mockLeaderboard: LeaderboardEntry[] = mockDevelopers
  .sort((a, b) => a.rating.rank - b.rating.rank)
  .map((dev, index) => ({
    rank: index + 1,
    previousRank: index + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3),
    developer: dev,
    score: Math.floor(dev.rating.overall * 1000),
    change: Math.floor(Math.random() * 200) - 100,
  }));

// ===========================
// Notifications
// ===========================

export const mockNotifications: Notification[] = [
  { id: "n-1", type: "achievement", title: "Achievement Unlocked!", message: "You earned the '10K Commits' achievement", isRead: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), icon: "Trophy" },
  { id: "n-2", type: "battle", title: "Battle Challenge!", message: "Sarah Johnson challenged you to a coding battle", isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), icon: "Swords", actionUrl: "/battles" },
  { id: "n-3", type: "challenge", title: "Challenge Complete", message: "You completed the 'Daily Commit' challenge (+50 XP)", isRead: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), icon: "Target" },
  { id: "n-4", type: "level_up", title: "Level Up!", message: "Congratulations! You reached Level 42", isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), icon: "ArrowUp" },
  { id: "n-5", type: "friend", title: "New Follower", message: "James Park started following you", isRead: true, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), icon: "UserPlus" },
  { id: "n-6", type: "system", title: "Weekly Report Ready", message: "Your weekly development report is ready to view", isRead: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), icon: "FileText" },
];

// ===========================
// Activities
// ===========================

export const mockActivities: Activity[] = [
  { id: "a-1", type: "commit", title: "Pushed 5 commits", description: "Added new chart components and fixed responsive layout", repository: "devbattle-engine", createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: "a-2", type: "pull_request", title: "Opened PR #234", description: "Feature: Add real-time collaboration support", repository: "neural-search", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "a-3", type: "review", title: "Reviewed PR #198", description: "Approved changes to the authentication module", repository: "cloud-deploy", createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: "a-4", type: "issue", title: "Closed Issue #67", description: "Fixed memory leak in connection pooling", repository: "api-gateway", createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: "a-5", type: "star", title: "Starred repository", description: "vercel/next.js", createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: "a-6", type: "achievement", title: "Achievement Unlocked", description: "Earned '10K Commits' achievement", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: "a-7", type: "commit", title: "Pushed 12 commits", description: "Refactored database layer for better performance", repository: "devbattle-engine", createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString() },
  { id: "a-8", type: "fork", title: "Forked repository", description: "rust-lang/rust-analyzer", createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
];

// ===========================
// Chart Data Generators
// ===========================

export function generateContributionData(days: number = 365): ContributionDay[] {
  const data: ContributionDay[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseChance = isWeekend ? 0.4 : 0.8;
    const hasContribution = Math.random() < baseChance;
    const count = hasContribution ? Math.floor(Math.random() * 15) + 1 : 0;
    const level = count === 0 ? 0 : count <= 3 ? 1 : count <= 7 ? 2 : count <= 11 ? 3 : 4;
    data.push({
      date: date.toISOString().split("T")[0],
      count,
      level: level as 0 | 1 | 2 | 3 | 4,
    });
  }
  return data;
}

export function generateCommitActivity(days: number = 90): CommitActivity[] {
  const data: CommitActivity[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCommits = isWeekend ? 3 : 8;
    const commits = Math.max(0, Math.floor(baseCommits + (Math.random() - 0.3) * 10));
    data.push({
      date: date.toISOString().split("T")[0],
      commits,
      additions: commits * Math.floor(Math.random() * 50 + 10),
      deletions: commits * Math.floor(Math.random() * 20 + 5),
    });
  }
  return data;
}

export function generateMonthlyData(months: number = 12): { month: string; value: number }[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data: { month: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    data.push({
      month: monthNames[date.getMonth()],
      value: Math.floor(Math.random() * 300 + 100),
    });
  }
  return data;
}

// ===========================
// Dashboard Stats
// ===========================

export const mockDashboardStats = [
  { title: "Total Commits", value: 12847, change: 12.5, icon: "GitCommit", color: "purple" },
  { title: "Pull Requests", value: 834, change: 8.3, icon: "GitPullRequest", color: "blue" },
  { title: "Code Reviews", value: 1256, change: -2.1, icon: "Eye", color: "emerald" },
  { title: "Active Streak", value: 47, change: 0, icon: "Flame", color: "orange", suffix: "days" },
];
