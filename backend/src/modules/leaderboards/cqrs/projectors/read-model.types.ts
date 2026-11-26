export interface LeaderboardRankItem {
  rank: number;
  userId: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  country?: string;
  score: number;
}

export interface PaginatedLeaderboardResult {
  data: LeaderboardRankItem[];
  total: number;
  limit: number;
  offset: number;
  metric: string;
  country?: string;
  latencyMs: number;
  source: 'redis_zset_read_model';
}

export interface UserReadMetadata {
  userId: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  country?: string;
  updatedAt?: string;
}
