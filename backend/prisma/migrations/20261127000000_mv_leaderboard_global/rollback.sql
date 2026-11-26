-- =========================================================================
-- Rollback Migration: 20261127000000_mv_leaderboard_global
-- Description: Tears down mv_leaderboard_global materialized view,
-- associated indexes, and pg_cron scheduled jobs.
-- =========================================================================

-- 1. Unschedule pg_cron job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('refresh_leaderboard')
      FROM cron.job
      WHERE jobname = 'refresh_leaderboard';
    EXCEPTION WHEN OTHERS THEN
      -- job might not exist
    END;
  END IF;
END $$;

-- 2. Drop Materialized View and its dependent indexes
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard_global CASCADE;
