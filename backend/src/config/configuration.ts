import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Strong Zod schema definitions for all dynamic platform configuration parameters.
 * Covers feature flags, rate limits, tournament parameters, AI model endpoints, and background jobs.
 */
export const DynamicConfigSchema = z.object({
  // Feature Flags
  FEATURE_BATTLES_ENABLED: z.boolean().default(true),
  FEATURE_CHALLENGES_ENABLED: z.boolean().default(true),
  FEATURE_GITHUB_SYNC_ENABLED: z.boolean().default(true),
  MAINTENANCE_MODE: z.boolean().default(false),
  FEATURE_AI_CODE_REVIEW_ENABLED: z.boolean().default(true),
  FEATURE_LEADERBOARD_STREAMING_ENABLED: z.boolean().default(true),

  // Rate Limits & Throttling
  RATE_LIMIT_QUOTA_DEFAULT: z.number().min(10).max(10000).default(60),
  RATE_LIMIT_WINDOW_SECONDS: z.number().min(1).max(3600).default(60),
  MAX_CONCURRENT_MATCHES: z.number().min(1).max(500).default(50),
  MAX_ACTIVE_STREAMS_PER_USER: z.number().min(1).max(50).default(5),

  // Matchmaking & ELO Parameters
  ELO_K_FACTOR: z.number().min(8).max(64).default(32),
  MATCHMAKING_ELO_THRESHOLD: z.number().min(50).max(1000).default(200),
  MATCHMAKING_QUEUE_TIMEOUT_SEC: z.number().min(5).max(300).default(30),

  // AI Model & Endpoint Settings
  AI_MODEL_ENDPOINT: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL_TIMEOUT_MS: z.number().min(500).max(60000).default(5000),
  AI_MAX_TOKENS: z.number().min(100).max(32000).default(4096),

  // Tournament Parameters
  TOURNAMENT_MAX_PARTICIPANTS: z.number().min(2).max(1024).default(64),
  TOURNAMENT_ROUND_DURATION_SEC: z.number().min(60).max(7200).default(600),

  // Background Sync & Health
  SYNC_CRON_INTERVAL_MINUTES: z.number().min(1).max(1440).default(60),
  HEALTH_CHECK_INTERVAL_SECONDS: z.number().min(1).max(300).default(10),
});

export type DynamicConfigValues = z.infer<typeof DynamicConfigSchema>;
export type DynamicConfigKey = Extract<keyof DynamicConfigValues, string>;

export interface ConfigChangeEvent<T = unknown> {
  key: string;
  previousValue: T | null;
  newValue: T;
  timestamp: number;
  source: 'etcd' | 'consul' | 'fallback' | 'manual' | 'stream';
}

export interface AuditLogEntry {
  id: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  updatedBy: string;
  timestamp: string;
  status: 'APPLIED' | 'REJECTED';
  reason?: string;
  source: 'ADMIN_API' | 'ETCD_WATCHER' | 'INITIALIZATION' | 'FALLBACK_CACHE';
}

export const DEFAULT_FALLBACK_CACHE_PATH = path.resolve(
  process.cwd(),
  '.codepulse-config-cache.json',
);

/**
 * Loads configuration values from the local file fallback cache if present.
 */
export function loadFallbackCache(
  cachePath: string = DEFAULT_FALLBACK_CACHE_PATH,
): Partial<DynamicConfigValues> {
  try {
    if (fs.existsSync(cachePath)) {
      const content = fs.readFileSync(cachePath, 'utf8');
      const parsed = JSON.parse(content);
      const validated = DynamicConfigSchema.partial().safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    }
  } catch {
    // Gracefully ignore file access or syntax errors on fallback loading
  }
  return {};
}

/**
 * Saves current configuration values to the local file fallback cache atomically.
 */
export function saveFallbackCache(
  values: Partial<DynamicConfigValues>,
  cachePath: string = DEFAULT_FALLBACK_CACHE_PATH,
): void {
  try {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${cachePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(values, null, 2), 'utf8');
    fs.renameSync(tempPath, cachePath);
  } catch {
    // Non-blocking fallback cache persistence
  }
}

/**
 * NestJS ConfigModule factory loader returning validated default configuration.
 */
export default () => ({
  dynamic: DynamicConfigSchema.parse({}),
});
