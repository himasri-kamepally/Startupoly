-- ==============================================================================
-- STARTUPOLY: CLEAN DATABASE RESET SCRIPT
-- ==============================================================================
-- Purpose:
--   Safely purges all old rooms, teams, player joins, scores, audit events,
--   and match history to start with a fresh, clean tournament state.
--
-- Preserved Safely:
--   ✓ Supabase Auth Users (auth.users)
--   ✓ Admin permissions (public.admins)
--   ✓ Official Business Catalog (public.business_catalog: 10 companies)
--   ✓ All tables, columns, indexes, custom types, functions, and RLS policies
--   ✓ Database credentials and project configuration
--
-- How to Run:
--   1. Open your Supabase Dashboard: https://supabase.com/dashboard
--   2. Select your project: psyruoujpaitwiembsex
--   3. Navigate to the "SQL Editor" in the left sidebar
--   4. Paste the queries from SECTION 1 to preview current data counts
--   5. Paste and run SECTION 2 (the TRANSACTIONAL CLEANUP)
--   6. Paste and run SECTION 3 to verify all game tables are clean (0 rows)
-- ==============================================================================


-- ==============================================================================
-- SECTION 1: PRE-CLEANUP AUDIT / PREVIEW
-- (Run this first to inspect what data will be deleted)
-- ==============================================================================

SELECT 'rooms' AS table_name, count(*) AS record_count FROM public.rooms
UNION ALL
SELECT 'teams', count(*) FROM public.teams
UNION ALL
SELECT 'team_secrets', count(*) FROM public.team_secrets
UNION ALL
SELECT 'team_claims', count(*) FROM public.team_claims
UNION ALL
SELECT 'team_businesses', count(*) FROM public.team_businesses
UNION ALL
SELECT 'activity_events', count(*) FROM public.activity_events
UNION ALL
SELECT 'final_results', count(*) FROM public.final_results
UNION ALL
SELECT 'join_attempts', count(*) FROM public.join_attempts
UNION ALL
SELECT 'admins (PRESERVED)', count(*) FROM public.admins
UNION ALL
SELECT 'business_catalog (PRESERVED)', count(*) FROM public.business_catalog;


-- ==============================================================================
-- SECTION 2: TRANSACTIONAL CLEANUP SCRIPT
-- (Deletes only match records in strict foreign-key dependency order)
-- ==============================================================================

BEGIN;

-- 1. Create backup table if it doesn't already exist and archive current state
CREATE TABLE IF NOT EXISTS public.match_data_backups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  backup_time timestamptz NOT NULL DEFAULT now(),
  archived_by uuid REFERENCES auth.users(id),
  data jsonb NOT NULL
);

INSERT INTO public.match_data_backups (data)
SELECT jsonb_build_object(
  'archived_at', now(),
  'rooms', coalesce((SELECT jsonb_agg(to_jsonb(r.*)) FROM public.rooms r), '[]'::jsonb),
  'teams', coalesce((SELECT jsonb_agg(to_jsonb(t.*)) FROM public.teams t), '[]'::jsonb),
  'team_secrets', coalesce((SELECT jsonb_agg(to_jsonb(ts.*)) FROM public.team_secrets ts), '[]'::jsonb),
  'team_claims', coalesce((SELECT jsonb_agg(to_jsonb(tc.*)) FROM public.team_claims tc), '[]'::jsonb),
  'team_businesses', coalesce((SELECT jsonb_agg(to_jsonb(tb.*)) FROM public.team_businesses tb), '[]'::jsonb),
  'activity_events', coalesce((SELECT jsonb_agg(to_jsonb(ae.*)) FROM public.activity_events ae), '[]'::jsonb),
  'final_results', coalesce((SELECT jsonb_agg(to_jsonb(fr.*)) FROM public.final_results fr), '[]'::jsonb),
  'join_attempts', coalesce((SELECT jsonb_agg(to_jsonb(ja.*)) FROM public.join_attempts ja), '[]'::jsonb)
);

-- 2. Bypass immutability triggers for this cleanup transaction
SET LOCAL app.allow_cleanup = 'true';

ALTER TABLE public.rooms DISABLE TRIGGER trg_rooms_immutable;
ALTER TABLE public.teams DISABLE TRIGGER trg_teams_immutable;
ALTER TABLE public.team_businesses DISABLE TRIGGER trg_team_businesses_immutable;

-- 3. Break circular foreign key on winner_team_id
UPDATE public.rooms SET winner_team_id = NULL WHERE winner_team_id IS NOT NULL;

-- 4. Delete dependent match records in correct foreign-key dependency order
DELETE FROM public.final_results;
DELETE FROM public.activity_events;
DELETE FROM public.team_businesses;
DELETE FROM public.team_claims;
DELETE FROM public.team_secrets;
DELETE FROM public.join_attempts;
DELETE FROM public.teams;
DELETE FROM public.rooms;

-- 5. Re-enable immutability triggers
ALTER TABLE public.rooms ENABLE TRIGGER trg_rooms_immutable;
ALTER TABLE public.teams ENABLE TRIGGER trg_teams_immutable;
ALTER TABLE public.team_businesses ENABLE TRIGGER trg_team_businesses_immutable;

COMMIT;


-- ==============================================================================
-- SECTION 3: POST-CLEANUP VERIFICATION QUERIES
-- (Run this after running SECTION 2 to verify 0 rows in game tables)
-- ==============================================================================

SELECT
  'rooms' AS table_name,
  count(*) AS remaining_count,
  CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END AS status
FROM public.rooms
UNION ALL
SELECT 'teams', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.teams
UNION ALL
SELECT 'team_secrets', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.team_secrets
UNION ALL
SELECT 'team_claims', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.team_claims
UNION ALL
SELECT 'team_businesses', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.team_businesses
UNION ALL
SELECT 'activity_events', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.activity_events
UNION ALL
SELECT 'final_results', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.final_results
UNION ALL
SELECT 'join_attempts', count(*), CASE WHEN count(*) = 0 THEN '✓ CLEAN' ELSE '⚠ NOT EMPTY' END FROM public.join_attempts
UNION ALL
SELECT 'admins (PRESERVED)', count(*), CASE WHEN count(*) > 0 THEN '✓ PRESERVED' ELSE '⚠ CHECK ADMIN' END FROM public.admins
UNION ALL
SELECT 'business_catalog (PRESERVED)', count(*), CASE WHEN count(*) = 10 THEN '✓ PRESERVED (10)' ELSE '⚠ CHECK CATALOG' END FROM public.business_catalog;
