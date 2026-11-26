export interface GlickoPlayer {
  rating: number; // e.g. 1500
  rd: number;     // rating deviation e.g. 200
  vol: number;    // volatility e.g. 0.06
}

export interface MatchmakingPlayer {
  id: string;
  rating: number;
  enqueuedAt: number;
}

export interface MatchmakingPair {
  player1: MatchmakingPlayer;
  player2: MatchmakingPlayer;
  ratingDelta: number;
  waitedMs: number;
}

export interface KeystrokeEvent {
  key: string;
  pressTime: number;
  releaseTime: number;
}

export interface KeystrokeAnalysis {
  isMacroInjected: boolean;
  confidence: number;
  dwellVariance: number;
  flightVariance: number;
}

export interface TournamentMatch {
  matchId: string;
  round: number;
  player1: string;
  player2: string;
  bracket: 'winners' | 'losers' | 'finals';
  isBye: boolean;
}

export interface BattlePassStatus {
  tier: number;
  currentTierXp: number;
  xpToNextTier: number;
  unlockedRewards: string[];
  overflowBonusXp: number;
}

export interface BattleEvent {
  step: number;
  action: string;
  timestamp: number;
  checksum: string;
}

export interface ReplayValidationResult {
  isValid: boolean;
  computedWinner: string;
  finalHash: string;
  discrepancies: string[];
}

export interface BetRecord {
  userId: string;
  outcome: 'player1' | 'player2';
  amount: number;
}

export interface MarketSettlement {
  winningOutcome: 'player1' | 'player2';
  totalPool: number;
  payouts: Record<string, number>;
}

export interface GuildMemberScore {
  userId: string;
  score: number;
}

export interface GuildScoreResult {
  guildId: string;
  totalScore: number;
  countedScores: number[];
}

export interface CodeSubmissionMetrics {
  userId: string;
  testsPassed: number;
  totalTests: number;
  cyclomaticComplexity: number;
  runtimeMs: number;
  memoryKb: number;
}
