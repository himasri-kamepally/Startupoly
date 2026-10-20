-- Migration 0026: Safe Match Data Reset & Backup
-- Allows administrators to clear old tournament match data to start fresh,
-- while preserving admins, user authentication accounts, business catalog,
-- database schema, types, and application configuration.

-- 1. Update fn_check_immutable_table to support safe admin cleanup sessions
CREATE OR REPLACE FUNCTION public.fn_check_immutable_table()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.allow_cleanup', true) = 'true' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'IMMUTABLE';
END;
$$;

-- 2. Audit/Backup table to archive cleared match state before removal
CREATE TABLE IF NOT EXISTS public.match_data_backups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  backup_time timestamptz NOT NULL DEFAULT now(),
  archived_by uuid REFERENCES auth.users(id),
  data jsonb NOT NULL
);
ALTER TABLE public.match_data_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage match backups"
  ON public.match_data_backups
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. Stored procedure: admin_clear_match_data
CREATE OR REPLACE FUNCTION public.admin_clear_match_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_backup jsonb;
  v_deleted_rooms int := 0;
  v_deleted_teams int := 0;
  v_deleted_events int := 0;
  v_deleted_results int := 0;
  v_deleted_claims int := 0;
  v_deleted_businesses int := 0;
  v_deleted_attempts int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  -- 1. Create a full archive of all existing match data before deletion
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
  ) INTO v_backup;

  -- Store the archive in the backup table
  INSERT INTO public.match_data_backups (archived_by, data)
  VALUES (v_admin_id, v_backup);

  -- 2. Allow cleanup through fn_check_immutable_table for this transaction
  PERFORM set_config('app.allow_cleanup', 'true', true);

  -- 3. Clear circular foreign key on winner_team_id
  UPDATE public.rooms SET winner_team_id = NULL WHERE winner_team_id IS NOT NULL;

  -- 4. Delete dependent records in strict relational dependency order
  DELETE FROM public.final_results;
  GET DIAGNOSTICS v_deleted_results = ROW_COUNT;

  DELETE FROM public.activity_events;
  GET DIAGNOSTICS v_deleted_events = ROW_COUNT;

  DELETE FROM public.team_businesses;
  GET DIAGNOSTICS v_deleted_businesses = ROW_COUNT;

  DELETE FROM public.team_claims;
  GET DIAGNOSTICS v_deleted_claims = ROW_COUNT;

  DELETE FROM public.team_secrets;

  DELETE FROM public.join_attempts;
  GET DIAGNOSTICS v_deleted_attempts = ROW_COUNT;

  DELETE FROM public.teams;
  GET DIAGNOSTICS v_deleted_teams = ROW_COUNT;

  DELETE FROM public.rooms;
  GET DIAGNOSTICS v_deleted_rooms = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'backup_saved', true,
    'deleted_rooms', v_deleted_rooms,
    'deleted_teams', v_deleted_teams,
    'deleted_events', v_deleted_events,
    'deleted_results', v_deleted_results,
    'deleted_claims', v_deleted_claims,
    'deleted_businesses', v_deleted_businesses,
    'deleted_attempts', v_deleted_attempts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_match_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_clear_match_data() TO authenticated;
