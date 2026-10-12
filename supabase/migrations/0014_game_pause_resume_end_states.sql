-- Migration 0014: Add PAUSED status, Pause/Resume/End RPCs, and Explicit Lifecycle States
-- STARTUPOLY Live Scoreboard & Game Management System

-- 1. Add PAUSED to room_status enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_enum enm ON typ.oid = enm.enumtypid
    WHERE typ.typname = 'room_status' AND enm.enumlabel = 'PAUSED'
  ) THEN
    ALTER TYPE public.room_status ADD VALUE 'PAUSED' AFTER 'ACTIVE';
  END IF;
END $$;

-- 2. Update status transition trigger fn_check_room_status_transition
CREATE OR REPLACE FUNCTION public.fn_check_room_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (
      (OLD.status = 'CREATED' AND NEW.status = 'LOBBY') OR
      (OLD.status = 'LOBBY' AND NEW.status = 'ACTIVE') OR
      (OLD.status = 'ACTIVE' AND NEW.status = 'PAUSED') OR
      (OLD.status = 'PAUSED' AND NEW.status = 'ACTIVE') OR
      (OLD.status = 'ACTIVE' AND NEW.status = 'TIME_EXPIRED') OR
      (OLD.status = 'PAUSED' AND NEW.status = 'TIME_EXPIRED') OR
      (OLD.status = 'ACTIVE' AND NEW.status = 'LOBBY') OR
      (OLD.status = 'PAUSED' AND NEW.status = 'LOBBY') OR
      (OLD.status = 'TIME_EXPIRED' AND NEW.status = 'FINALIZED')
    ) THEN
      RAISE EXCEPTION 'INVALID_TRANSITION';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update expire_if_due to ensure started_at is NOT NULL before expiring
CREATE OR REPLACE FUNCTION public.expire_if_due(p_room_id uuid)
RETURNS public.room_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.room_status;
  v_ends_at timestamptz;
  v_started_at timestamptz;
BEGIN
  SELECT status, ends_at, started_at INTO v_status, v_ends_at, v_started_at
  FROM public.rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM public.raise_error('ROOM_NOT_FOUND', jsonb_build_object('room_id', p_room_id));
  END IF;

  -- Only ACTIVE rooms with started_at AND ends_at in the past can transition to TIME_EXPIRED
  IF v_status = 'ACTIVE' AND v_started_at IS NOT NULL AND v_ends_at IS NOT NULL AND public.app_now() >= v_ends_at THEN
    UPDATE public.rooms
    SET status = 'TIME_EXPIRED'
    WHERE id = p_room_id;

    INSERT INTO public.activity_events (
      room_id,
      type,
      note,
      created_at
    ) VALUES (
      p_room_id,
      'TIME_EXPIRED',
      'Gameplay window expired. Scores frozen.',
      public.app_now()
    );

    v_status := 'TIME_EXPIRED';
  END IF;

  RETURN v_status;
END;
$$;

-- 4. RPC: admin_pause_game(room_id)
CREATE OR REPLACE FUNCTION public.admin_pause_game(room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_remaining_seconds int;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM public.raise_error('ROOM_NOT_FOUND');
  END IF;

  IF v_room.status <> 'ACTIVE' THEN
    PERFORM public.raise_error('INVALID_TRANSITION', jsonb_build_object('current_status', v_room.status));
  END IF;

  IF v_room.ends_at IS NOT NULL THEN
    v_remaining_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_room.ends_at - public.app_now()))::int);
  ELSE
    v_remaining_seconds := v_room.duration_seconds;
  END IF;

  UPDATE public.rooms
  SET status = 'PAUSED',
      duration_seconds = v_remaining_seconds,
      ends_at = NULL
  WHERE id = room_id;

  INSERT INTO public.activity_events (
    room_id,
    type,
    note,
    created_at
  ) VALUES (
    room_id,
    'ADJUSTMENT',
    'Match paused by administrator. Game clock frozen.',
    public.app_now()
  );

  RETURN public.get_admin_snapshot(room_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_pause_game(uuid) TO authenticated;

-- 5. RPC: admin_resume_game(room_id)
CREATE OR REPLACE FUNCTION public.admin_resume_game(room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM public.raise_error('ROOM_NOT_FOUND');
  END IF;

  IF v_room.status <> 'PAUSED' THEN
    PERFORM public.raise_error('INVALID_TRANSITION', jsonb_build_object('current_status', v_room.status));
  END IF;

  UPDATE public.rooms
  SET status = 'ACTIVE',
      ends_at = public.app_now() + (v_room.duration_seconds || ' seconds')::interval
  WHERE id = room_id;

  INSERT INTO public.activity_events (
    room_id,
    type,
    note,
    created_at
  ) VALUES (
    room_id,
    'ADJUSTMENT',
    'Match resumed by administrator. Game clock active.',
    public.app_now()
  );

  RETURN public.get_admin_snapshot(room_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_resume_game(uuid) TO authenticated;

-- 6. RPC: admin_end_game(room_id, note)
CREATE OR REPLACE FUNCTION public.admin_end_game(room_id uuid, note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE id = room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM public.raise_error('ROOM_NOT_FOUND');
  END IF;

  IF v_room.status NOT IN ('ACTIVE', 'PAUSED') THEN
    PERFORM public.raise_error('INVALID_TRANSITION', jsonb_build_object('current_status', v_room.status));
  END IF;

  UPDATE public.rooms
  SET status = 'TIME_EXPIRED',
      ends_at = public.app_now()
  WHERE id = room_id;

  INSERT INTO public.activity_events (
    room_id,
    type,
    note,
    created_at
  ) VALUES (
    room_id,
    'TIME_EXPIRED',
    coalesce(nullif(trim(note), ''), 'Match concluded early by administrator. Scores frozen.'),
    public.app_now()
  );

  RETURN public.get_admin_snapshot(room_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_end_game(uuid, text) TO authenticated;

-- 7. Update get_admin_snapshot to include semantic lifecycle_state and duration_seconds
CREATE OR REPLACE FUNCTION public.get_admin_snapshot(room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room jsonb;
  v_teams jsonb;
  v_events jsonb;
  v_raw_room public.rooms%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.raise_error('NOT_ADMIN');
  END IF;

  PERFORM public.expire_if_due(room_id);

  SELECT * INTO v_raw_room
  FROM public.rooms
  WHERE id = room_id;

  IF NOT FOUND THEN
    PERFORM public.raise_error('ROOM_NOT_FOUND');
  END IF;

  v_room := jsonb_build_object(
    'id', v_raw_room.id,
    'code', v_raw_room.code,
    'status', v_raw_room.status,
    'lifecycle_state', CASE v_raw_room.status
      WHEN 'CREATED' THEN 'not_started'
      WHEN 'LOBBY' THEN 'waiting'
      WHEN 'ACTIVE' THEN 'running'
      WHEN 'PAUSED' THEN 'paused'
      WHEN 'TIME_EXPIRED' THEN 'completed'
      WHEN 'FINALIZED' THEN 'completed'
      ELSE 'waiting'
    END,
    'team_count', v_raw_room.team_count,
    'duration_seconds', v_raw_room.duration_seconds,
    'started_at', v_raw_room.started_at,
    'ends_at', v_raw_room.ends_at,
    'finalized_at', v_raw_room.finalized_at,
    'winner_team_id', v_raw_room.winner_team_id,
    'tiebreak_note', v_raw_room.tiebreak_note,
    'created_by', v_raw_room.created_by,
    'created_at', v_raw_room.created_at
  );

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'slot', t.slot,
      'name', t.name,
      'color', t.color,
      'cash', t.cash,
      'cv', t.cv,
      'is_bankrupt', t.is_bankrupt,
      'version', t.version,
      'tiebreak_order', t.tiebreak_order,
      'claimed', EXISTS (SELECT 1 FROM public.team_claims tc WHERE tc.team_id = t.id),
      'pin', ts.join_pin,
      'businesses', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'business_key', tb.business_key,
            'name', bc.name,
            'level', tb.level,
            'cost', bc.cost,
            'initial_cv', bc.initial_cv
          ) ORDER BY bc.sort_order
        )
        FROM public.team_businesses tb
        JOIN public.business_catalog bc ON tb.business_key = bc.key
        WHERE tb.team_id = t.id
      ), '[]'::jsonb)
    ) ORDER BY t.slot
  ), '[]'::jsonb) INTO v_teams
  FROM public.teams t
  LEFT JOIN public.team_secrets ts ON t.id = ts.team_id
  WHERE t.room_id = get_admin_snapshot.room_id;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'team_id', e.team_id,
      'group_id', e.group_id,
      'type', e.type,
      'business_key', e.business_key,
      'prev', e.prev,
      'new', e.new,
      'note', e.note,
      'is_correction', e.is_correction,
      'created_at', e.created_at
    ) ORDER BY e.id DESC
  ), '[]'::jsonb) INTO v_events
  FROM (
    SELECT *
    FROM public.activity_events
    WHERE public.activity_events.room_id = get_admin_snapshot.room_id
    ORDER BY id DESC
    LIMIT 200
  ) e;

  RETURN jsonb_build_object(
    'room', v_room,
    'server_now', public.app_now(),
    'teams', v_teams,
    'events', v_events
  );
END;
$$;

-- 8. Update get_my_state to prioritize ACTIVE/LOBBY rooms and prevent showing TIME_EXPIRED before match starts
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
  v_status public.room_status;
  v_started_at timestamptz;
  v_ends_at timestamptz;
  v_duration_seconds int;
  v_slot smallint;
  v_name text;
  v_color text;
  v_cash int;
  v_cv int;
  v_is_bankrupt boolean;
  v_businesses jsonb;
  v_leaderboard jsonb := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Priority 1: User's claim in an active, paused, or lobby room
  SELECT tc.team_id, t.room_id INTO v_team_id, v_room_id
  FROM public.team_claims tc
  JOIN public.teams t ON tc.team_id = t.id
  JOIN public.rooms r ON t.room_id = r.id
  WHERE tc.user_id = v_user_id AND r.status IN ('ACTIVE', 'PAUSED', 'LOBBY', 'CREATED')
  ORDER BY tc.claimed_at DESC
  LIMIT 1;

  -- Priority 2: User's claim in a TIME_EXPIRED room (only if started_at is NOT NULL)
  IF v_room_id IS NULL THEN
    SELECT tc.team_id, t.room_id INTO v_team_id, v_room_id
    FROM public.team_claims tc
    JOIN public.teams t ON tc.team_id = t.id
    JOIN public.rooms r ON t.room_id = r.id
    WHERE tc.user_id = v_user_id AND r.status = 'TIME_EXPIRED' AND r.started_at IS NOT NULL
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

  v_status := public.expire_if_due(v_room_id);

  SELECT status, started_at, ends_at, duration_seconds INTO v_status, v_started_at, v_ends_at, v_duration_seconds
  FROM public.rooms
  WHERE id = v_room_id;

  -- CRITICAL GUARD: A room where started_at IS NULL can NEVER be TIME_EXPIRED
  IF v_started_at IS NULL AND v_status = 'TIME_EXPIRED' THEN
    v_status := 'LOBBY';
  END IF;

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
  END IF;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'status', v_status,
      'lifecycle_state', CASE v_status
        WHEN 'CREATED' THEN 'not_started'
        WHEN 'LOBBY' THEN 'waiting'
        WHEN 'ACTIVE' THEN 'running'
        WHEN 'PAUSED' THEN 'paused'
        WHEN 'TIME_EXPIRED' THEN 'completed'
        WHEN 'FINALIZED' THEN 'completed'
        ELSE 'waiting'
      END,
      'started_at', v_started_at,
      'ends_at', v_ends_at,
      'duration_seconds', v_duration_seconds,
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
    'leaderboard', v_leaderboard
  );
END;
$$;
