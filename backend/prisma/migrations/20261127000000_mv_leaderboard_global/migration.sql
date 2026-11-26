-- =========================================================================
-- Migration: 20261127000000_mv_leaderboard_global
-- Description: Automated PostgreSQL Materialized View Invalidation Engine with pg_cron
-- Pre-aggregates user total XP, battle wins, win-rate percentage, and rank ordering
-- with unique index on user_id for concurrent refreshes.
-- =========================================================================

-- 1. Create Materialized View pre-aggregating developer leaderboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard_global AS
WITH battle_aggregates AS (
  SELECT
    p.user_id,
    COUNT(*)::int AS total_battles,
    COUNT(*) FILTER (WHERE p.is_winner = true)::int AS battle_wins
  FROM (
    SELECT "challengerId" AS user_id, ("winnerId" = "challengerId") AS is_winner
    FROM battles
    WHERE status = 'COMPLETED'
    UNION ALL
    SELECT "opponentId" AS user_id, ("winnerId" = "opponentId") AS is_winner
    FROM battles
    WHERE status = 'COMPLETED'
  ) p
  GROUP BY p.user_id
)
SELECT
  u.id AS user_id,
  u.username,
  u.name,
  u.avatar,
  u.location AS country,
  COALESCE(dr.xp, 0)::int AS total_xp,
  COALESCE(ba.battle_wins, 0)::int AS battle_wins,
  COALESCE(ba.total_battles, 0)::int AS total_battles,
  CASE
    WHEN COALESCE(ba.total_battles, 0) > 0 THEN
      ROUND((COALESCE(ba.battle_wins, 0)::numeric / ba.total_battles::numeric) * 100.0, 2)::float
    ELSE 0.00::float
  END AS win_rate,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(dr.xp, 0) DESC, COALESCE(ba.battle_wins, 0) DESC, u.id ASC
  )::int AS rank,
  CURRENT_TIMESTAMP AS refreshed_at
FROM users u
LEFT JOIN developer_ratings dr ON dr."userId" = u.id
LEFT JOIN battle_aggregates ba ON ba.user_id = u.id;

-- 2. Create Unique Index on user_id (Mandatory for REFRESH MATERIALIZED VIEW CONCURRENTLY)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboard_global_user_id
  ON mv_leaderboard_global (user_id);

-- 3. Create Supporting Indexes for Instant Index Scans and Filtered Lookups
CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_global_rank
  ON mv_leaderboard_global (rank);

CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_global_country_rank
  ON mv_leaderboard_global (country, rank);

CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_global_total_xp
  ON mv_leaderboard_global (total_xp DESC);

-- 4. Configure pg_cron Extension and Schedule Concurrent Refresh Every 5 Minutes
DO $$
BEGIN
  -- Attempt to enable pg_cron if supported in PostgreSQL environment
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension not available or permissions restricted in current environment';
  END;

  -- Schedule cron job if pg_cron is enabled
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('refresh_leaderboard')
      FROM cron.job
      WHERE jobname = 'refresh_leaderboard';
    EXCEPTION WHEN OTHERS THEN
      -- job might not exist yet
    END;

    PERFORM cron.schedule(
      'refresh_leaderboard',
      '*/5 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global'
    );
  END IF;
END $$;
