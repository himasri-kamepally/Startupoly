-- Migration 0025: Independent Rooms & Safe Join Flow
-- STARTUPOLY Live Scoreboard & Game Management System
--
-- 1. Drops the single-active-room constraint so organizers can create multiple
--    independent rooms without requiring previous rooms to be deleted or finalized.
-- 2. Ensures uniqueness on active room codes.
-- 3. Updates admin_create_room to remove the single-room check (NON_FINAL_ROOM_EXISTS).
--    Each new room starts with completely fresh, independent state:
--    ₹1,000 cash, ₹0 CV, no businesses, active status, unique 4-digit PINs.
-- 4. Updates get_my_state to include room code and room ID for player reconnection.

BEGIN;

-- 1. Drop single-active-room bottleneck index if present
DROP INDEX IF EXISTS public.idx_rooms_single_active;

-- 2. Ensure unique active room code index
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_unique_active_code 
  ON public.rooms (code) 
  WHERE status <> 'FINALIZED';

-- 3. Update admin_create_room to allow multiple concurrent rooms
CREATE OR REPLACE FUNCTION public.admin_create_room(
  team_count int,
  teams jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_team_id uuid;
  v_team_elem jsonb;
  v_name text;
  v_color text;
  v_pin text;
  i int;
  v_room jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  IF team_count NOT BETWEEN 5 AND 6 THEN
    PERFORM public.raise_error('INVALID_VALUE', jsonb_build_object('team_count', team_count));
  END IF;

  IF jsonb_array_length(teams) <> team_count THEN
    PERFORM public.raise_error('INVALID_VALUE', jsonb_build_object('teams_length', jsonb_array_length(teams)));
  END IF;

  -- Generate unique 6-character room code (avoiding ambiguous characters 0, 1, I, O)
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_alphabet, floor(random() * 32)::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.rooms WHERE code = v_code AND status <> 'FINALIZED'
    );
  END LOOP;

  INSERT INTO public.rooms (code, status, team_count, created_by, created_at)
  VALUES (v_code, 'CREATED', team_count, auth.uid(), public.app_now())
  RETURNING id INTO v_room_id;

  -- Create independent teams: each starts with ₹1,000 cash, ₹0 CV, 0 businesses
  FOR i IN 1..team_count LOOP
    v_team_elem := teams->(i - 1);
    v_name := trim(coalesce(v_team_elem->>'name', ''));
    v_color := upper(trim(coalesce(v_team_elem->>'color', '')));

    IF char_length(v_name) < 1 OR char_length(v_name) > 30 OR v_color !~ '^#[0-9A-Fa-f]{6}$' THEN
      PERFORM public.raise_error('INVALID_VALUE', jsonb_build_object('slot', i, 'name', v_name, 'color', v_color));
    END IF;

    -- Generate unique 4-digit PIN for each team
    LOOP
      v_pin := lpad(floor(random() * 10000)::text, 4, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.team_secrets ts
        JOIN public.teams t ON ts.team_id = t.id
        WHERE t.room_id = v_room_id AND ts.join_pin = v_pin
      );
    END LOOP;

    INSERT INTO public.teams (
      room_id, slot, name, color, cash, cv, is_bankrupt, version, created_at
    ) VALUES (
      v_room_id, i, v_name, v_color, 1000, 0, false, 0, public.app_now()
    ) RETURNING id INTO v_team_id;

    INSERT INTO public.team_secrets (team_id, join_pin)
    VALUES (v_team_id, v_pin);
  END LOOP;

  INSERT INTO public.activity_events (
    room_id, type, new, actor_id, created_at
  ) VALUES (
    v_room_id,
    'ROOM_CREATED',
    jsonb_build_object('code', v_code, 'team_count', team_count),
    auth.uid(),
    public.app_now()
  );

  SELECT jsonb_build_object(
    'id', r.id,
    'code', r.code,
    'status', r.status,
    'team_count', r.team_count,
    'created_at', r.created_at
  ) INTO v_room
  FROM public.rooms r
  WHERE r.id = v_room_id;

  RETURN v_room;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_room(int, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_room(int, jsonb) TO authenticated;

-- 4. Update get_my_state to return room code and support active room reconnection
CREATE OR REPLACE FUNCTION public.get_my_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_team_id uuid;
  v_room_id uuid;
  v_raw_room public.rooms%ROWTYPE;
  v_status public.room_status;
  v_slot smallint;
  v_name text;
  v_color text;
  v_cash int;
  v_cv int;
  v_is_bankrupt boolean;
  v_businesses jsonb;
  v_leaderboard jsonb := NULL;
  v_final_res jsonb := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Priority 1: User's claim in an active, paused, or lobby room
  SELECT tc.team_id, t.room_id INTO v_team_id, v_room_id
  FROM public.team_claims tc
  JOIN public.teams t ON tc.team_id = t.id
  JOIN public.rooms r ON t.room_id = r.id
  WHERE tc.user_id = v_user_id AND r.status IN ('ACTIVE', 'LOBBY', 'CREATED')
  ORDER BY tc.claimed_at DESC
  LIMIT 1;

  -- Priority 2: User's claim in a TIME_EXPIRED room
  IF v_room_id IS NULL THEN
    SELECT tc.team_id, t.room_id INTO v_team_id, v_room_id
    FROM public.team_claims tc
    JOIN public.teams t ON tc.team_id = t.id
    JOIN public.rooms r ON t.room_id = r.id
    WHERE tc.user_id = v_user_id AND r.status = 'TIME_EXPIRED'
    ORDER BY r.ends_at DESC NULLS LAST, tc.claimed_at DESC
    LIMIT 1;
  END IF;

  -- Priority 3: User's claim in the most recently finalized room
  IF v_room_id IS NULL THEN
    SELECT tc.team_id, t.room_id INTO v_team_id, v_room_id
    FROM public.team_claims tc
    JOIN public.teams t ON tc.team_id = t.id
    JOIN public.rooms r ON t.room_id = r.id
    WHERE tc.user_id = v_user_id AND r.status = 'FINALIZED'
    ORDER BY r.finalized_at DESC NULLS LAST, tc.claimed_at DESC
    LIMIT 1;
  END IF;

  IF v_room_id IS NULL THEN
    RETURN NULL;
  END IF;

  PERFORM public.expire_if_due(v_room_id);

  SELECT * INTO v_raw_room
  FROM public.rooms
  WHERE id = v_room_id;

  v_status := v_raw_room.status;

  SELECT slot, name, color, cash, cv, is_bankrupt
  INTO v_slot, v_name, v_color, v_cash, v_cv, v_is_bankrupt
  FROM public.teams
  WHERE id = v_team_id;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'business_key', tb.business_key,
      'name', bc.name,
      'level', tb.level,
      'cost', bc.cost,
      'initial_cv', bc.initial_cv,
      'cv_contribution', bc.initial_cv + (CASE WHEN tb.level >= 1 THEN bc.u1_cv ELSE 0 END) + (CASE WHEN tb.level >= 2 THEN bc.u2_cv ELSE 0 END)
    ) ORDER BY bc.sort_order
  ), '[]'::jsonb) INTO v_businesses
  FROM public.team_businesses tb
  JOIN public.business_catalog bc ON tb.business_key = bc.key
  WHERE tb.team_id = v_team_id;

  IF v_status = 'FINALIZED' THEN
    SELECT coalesce(jsonb_agg(
      jsonb_build_object(
        'rank', fr.rank,
        'name', t.name,
        'color', t.color,
        'cv', fr.cv,
        'cash', fr.cash,
        'business_count', fr.business_count,
        'is_bankrupt', fr.is_bankrupt
      ) ORDER BY fr.rank ASC
    ), '[]'::jsonb) INTO v_leaderboard
    FROM public.final_results fr
    JOIN public.teams t ON fr.team_id = t.id
    WHERE fr.room_id = v_room_id;

    SELECT jsonb_build_object(
      'rank', fr.rank,
      'cv', fr.cv,
      'cash', fr.cash,
      'business_count', fr.business_count,
      'is_bankrupt', fr.is_bankrupt
    ) INTO v_final_res
    FROM public.final_results fr
    WHERE fr.room_id = v_room_id AND fr.team_id = v_team_id;
  END IF;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_raw_room.id,
      'code', v_raw_room.code,
      'status', v_status,
      'lifecycle_state', CASE v_status
        WHEN 'CREATED' THEN 'not_started'
        WHEN 'LOBBY' THEN 'waiting'
        WHEN 'ACTIVE' THEN 'running'
        WHEN 'TIME_EXPIRED' THEN 'completed'
        WHEN 'FINALIZED' THEN 'completed'
        ELSE 'waiting'
      END,
      'started_at', v_raw_room.started_at,
      'ends_at', v_raw_room.ends_at,
      'duration_seconds', v_raw_room.duration_seconds,
      'server_now', public.app_now()
    ),
    'team', jsonb_build_object(
      'slot', v_slot,
      'name', v_name,
      'color', v_color,
      'cash', v_cash,
      'cv', v_cv,
      'is_bankrupt', v_is_bankrupt
    ),
    'businesses', v_businesses,
    'leaderboard', v_leaderboard,
    'final_result', v_final_res
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_state() TO authenticated;

COMMIT;
