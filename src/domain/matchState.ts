export type MatchPhase = 'SETUP' | 'LIVE' | 'WRAP_UP' | 'RESET' | 'COMPLETED';

export type TurnStep = 'ROLL' | 'RESOLVE' | 'DONE';

export interface PersistedMatchState {
  roomId: string;
  matchNumber: number;
  phase: MatchPhase;
  activeTeamId: string;
  activeTeamSlot?: number;
  turnOrder: string[];
  currentRoll: number | null;
  rollHistory: number[];
  consecutiveSixes: number;
  positions: Record<string, number>; // teamId -> board space index (0..19)
  turnStep: TurnStep;
  landingResolved: boolean;
  extraRollGranted: boolean;
  skippedTurns: Record<string, boolean>; // teamId -> is next turn skipped
  pendingResolution: {
    spaceIndex: number;
    passedStart: boolean;
  } | null;
  preTurnSnapshot: {
    teamId: string;
    position: number;
    cash: number;
    cv: number;
  } | null;
  updatedAt: string;
}

const STORAGE_PREFIX = 'startupoly_match_state_';

export function getMatchStorageKey(roomId: string): string {
  return `${STORAGE_PREFIX}${roomId}`;
}

export function loadMatchState(
  roomId: string,
  teams: Array<{ id: string; is_bankrupt?: boolean }> = []
): PersistedMatchState {
  const defaultTurnOrder = teams.map((t) => t.id);
  const defaultPositions: Record<string, number> = {};
  teams.forEach((t) => {
    defaultPositions[t.id] = 0;
  });

  const fallback: PersistedMatchState = {
    roomId,
    matchNumber: 1,
    phase: 'SETUP',
    activeTeamId: defaultTurnOrder[0] || '',
    activeTeamSlot: 1,
    turnOrder: defaultTurnOrder,
    currentRoll: null,
    rollHistory: [],
    consecutiveSixes: 0,
    positions: defaultPositions,
    turnStep: 'ROLL',
    landingResolved: false,
    extraRollGranted: false,
    skippedTurns: {},
    pendingResolution: null,
    preTurnSnapshot: null,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(getMatchStorageKey(roomId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedMatchState>;

    // Ensure all current teams have a position
    const mergedPositions = { ...defaultPositions, ...(parsed.positions || {}) };
    const mergedTurnOrder =
      parsed.turnOrder && parsed.turnOrder.length > 0 ? parsed.turnOrder : defaultTurnOrder;

    return {
      roomId,
      matchNumber: parsed.matchNumber || 1,
      phase: parsed.phase || 'SETUP',
      activeTeamId: parsed.activeTeamId || defaultTurnOrder[0] || '',
      activeTeamSlot: parsed.activeTeamSlot ?? 1,
      turnOrder: mergedTurnOrder,
      currentRoll: parsed.currentRoll ?? null,
      rollHistory: parsed.rollHistory || [],
      consecutiveSixes: parsed.consecutiveSixes || 0,
      positions: mergedPositions,
      turnStep: parsed.turnStep || 'ROLL',
      landingResolved: parsed.landingResolved ?? false,
      extraRollGranted: parsed.extraRollGranted ?? false,
      skippedTurns: parsed.skippedTurns || {},
      pendingResolution: parsed.pendingResolution || null,
      preTurnSnapshot: parsed.preTurnSnapshot || null,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Failed to parse match state from localStorage:', err);
    return fallback;
  }
}

export function saveMatchState(state: PersistedMatchState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const updated = { ...state, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(getMatchStorageKey(state.roomId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save match state to localStorage:', err);
  }
}

export function getNextActiveTeamId(
  currentId: string,
  turnOrder: string[],
  bankruptTeams: Set<string> = new Set()
): string {
  if (turnOrder.length === 0) return '';
  const eligible = turnOrder.filter((id) => !bankruptTeams.has(id));
  if (eligible.length === 0) return '';

  const currentIndex = eligible.indexOf(currentId);
  if (currentIndex === -1) return eligible[0];
  const nextIndex = (currentIndex + 1) % eligible.length;
  return eligible[nextIndex];
}
