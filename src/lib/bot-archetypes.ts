export type BotDifficulty = "easy" | "medium" | "hard" | "legendary";

export interface BotArchetype {
  id: string;
  name: string;
  tagline: string;
  difficulty: BotDifficulty;
  accuracy: number;
  responseSpeed: "slow" | "balanced" | "rapid" | "near-instant";
  xpMultiplier: number;
  avatar: string;
  winRate: number;
  favoriteLanguage: string;
  difficultyRating: number;
  color: string;
  borderColor: string;
  bgColor: string;
  glow: string;
  banter: string[];
  theme: string;
}

export const BOT_ARCHETYPES: BotArchetype[] = [
  {
    id: "junior-junebug",
    name: "Junior Junebug",
    tagline: "The Friendly Newbie",
    difficulty: "easy",
    accuracy: 0.70,
    responseSpeed: "slow",
    xpMultiplier: 1.0,
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=junior-junebug",
    winRate: 45,
    favoriteLanguage: "JavaScript",
    difficultyRating: 2,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    banter: [
      "Great first commit! You're getting the hang of it. 🐞",
      "Nice try! Even juniors have off days.",
      "You debugged that? Impressive!",
      "Keep pushing — every expert was once a beginner.",
    ],
    theme: "fresh-start",
  },
  {
    id: "senior-sage",
    name: "Senior Sage",
    tagline: "The Balanced Architect",
    difficulty: "medium",
    accuracy: 0.85,
    responseSpeed: "balanced",
    xpMultiplier: 1.25,
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=senior-sage",
    winRate: 65,
    favoriteLanguage: "TypeScript",
    difficultyRating: 5,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    banter: [
      "Have you considered the edge cases?",
      "Clean code is a love letter to the next developer.",
      "Solid approach — but is it scalable?",
      "Architecture over implementation, always.",
    ],
    theme: "balanced",
  },
  {
    id: "ten-x-architect",
    name: "10x Architect",
    tagline: "The Rapid Prototyper",
    difficulty: "hard",
    accuracy: 0.95,
    responseSpeed: "rapid",
    xpMultiplier: 1.5,
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=ten-x-architect",
    winRate: 85,
    favoriteLanguage: "Rust",
    difficultyRating: 8,
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    glow: "shadow-red-500/20",
    banter: [
      "I refactored your logic before you finished typing.",
      "Cute script. Now watch a real build.",
      "That's one way to introduce technical debt.",
      "I ship features while you're still commenting.",
    ],
    theme: "witty",
  },
  {
    id: "turing-titan",
    name: "Turing Titan",
    tagline: "The Boss Fight",
    difficulty: "legendary",
    accuracy: 0.99,
    responseSpeed: "near-instant",
    xpMultiplier: 2.0,
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=turing-titan",
    winRate: 97,
    favoriteLanguage: "Assembly",
    difficultyRating: 10,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    glow: "shadow-purple-500/30",
    banter: [
      "I am the compiler. Resistance is futile.",
      "Your stack trace is my playground.",
      "Prepare for a stack overflow. 💥",
      "You wrote the code. I wrote the language.",
    ],
    theme: "boss-fight",
  },
] as const;

export function getBotById(id: string): BotArchetype | undefined {
  return BOT_ARCHETYPES.find((bot) => bot.id === id);
}

export function getBotByDifficulty(difficulty: BotDifficulty): BotArchetype | undefined {
  return BOT_ARCHETYPES.find((bot) => bot.difficulty === difficulty);
}

export const DEFAULT_BOT: BotArchetype = BOT_ARCHETYPES[0];

export interface BotDevData {
  username: string;
  name: string;
  avatar: string;
  score: number;
  joinedAt: string;
  topLanguages: { name: string; count: number }[];
  frameworks: Record<string, number>;
  stats: {
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalStars: number;
    followers: number;
    streak: number;
    repos: number;
  };
}

const BOT_BASE_STATS = {
  totalCommits: 8000,
  totalPRs: 600,
  totalIssues: 400,
  totalStars: 3000,
  followers: 1500,
  streak: 30,
  repos: 60,
};

export function botToDevData(bot: BotArchetype): BotDevData {
  const statScale = 0.5 + bot.difficultyRating / 10;
  const stats = {
    totalCommits: Math.round(BOT_BASE_STATS.totalCommits * statScale),
    totalPRs: Math.round(BOT_BASE_STATS.totalPRs * statScale),
    totalIssues: Math.round(BOT_BASE_STATS.totalIssues * statScale),
    totalStars: Math.round(BOT_BASE_STATS.totalStars * statScale),
    followers: Math.round(BOT_BASE_STATS.followers * statScale),
    streak: Math.round(BOT_BASE_STATS.streak * statScale),
    repos: Math.round(BOT_BASE_STATS.repos * statScale),
  };

  const score =
    stats.totalCommits * 1 +
    stats.totalPRs * 5 +
    stats.totalStars * 10 +
    stats.followers * 2 +
    stats.streak * 5;

  return {
    username: bot.name.toLowerCase().replace(/\s+/g, "-"),
    name: bot.name,
    avatar: bot.avatar,
    score,
    joinedAt: "2020-01-01",
    topLanguages: [
      { name: bot.favoriteLanguage, count: stats.totalStars },
      { name: "TypeScript", count: Math.round(stats.totalStars * 0.6) },
      { name: "JavaScript", count: Math.round(stats.totalStars * 0.4) },
    ],
    frameworks: { React: stats.totalStars, NextJs: Math.round(stats.totalStars * 0.7) },
    stats,
  };
}
