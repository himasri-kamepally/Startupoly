import React from 'react';
import { Countdown, StatusPill } from '../../../ui';

export interface GameControlStatusCardProps {
  roomCode: string;
  status: string; // 'CREATED' | 'LOBBY' | 'ACTIVE' | 'PAUSED' | 'TIME_EXPIRED' | 'FINALIZED'
  lifecycleState?: string;
  endsAt: string | null;
  serverNow?: string | null;
  durationSeconds?: number;
  activeTeamName?: string;
  activeTeamSlot?: number;
  activeTeamColor?: string;
  onStartGame?: () => void;
  onPauseGame?: () => void;
  onResumeGame?: () => void;
  onEndGame?: () => void;
  isActionLoading?: boolean;
  onAbortGame?: () => void;
}

export const GameControlStatusCard: React.FC<GameControlStatusCardProps> = ({
  roomCode,
  status,
  lifecycleState,
  endsAt,
  serverNow,
  durationSeconds,
  activeTeamName,
  activeTeamSlot,
  activeTeamColor,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onEndGame,
  isActionLoading = false,
  onAbortGame,
}) => {
  const normalizedStatus = status.toUpperCase();

  const isWaiting =
    normalizedStatus === 'LOBBY' ||
    normalizedStatus === 'CREATED' ||
    normalizedStatus === 'WAITING' ||
    normalizedStatus === 'NOT_STARTED';

  const isLive = normalizedStatus === 'ACTIVE' || normalizedStatus === 'RUNNING';
  const isPaused = normalizedStatus === 'PAUSED';
  const isGameOver =
    normalizedStatus === 'TIME_EXPIRED' ||
    normalizedStatus === 'FINALIZED' ||
    normalizedStatus === 'COMPLETED';

  // Determine current phase description
  let phaseText = 'Phase 1: Pre-Match Setup & Lobby Connections';
  let helperText = 'All teams connect via 4-digit PIN. Click "Start Game" once players are ready.';

  if (isLive) {
    phaseText = 'Phase 2: Live Trading & Startup Operations';
    helperText = 'Match is live! Select any team from the Participants section to record financial transactions, acquisitions, or board events.';
  } else if (isPaused) {
    phaseText = 'Phase 2 (Paused): Match Intermission';
    helperText = 'The game timer is frozen. Board transactions are temporarily held. Click "Resume Game" to continue the match.';
  } else if (isGameOver) {
    if (normalizedStatus === 'FINALIZED') {
      phaseText = 'Phase 4: Official Final Results Archived';
      helperText = 'The match has been permanently finalized. Standings are official. Export scores to CSV or start a new match.';
    } else {
      phaseText = 'Phase 3: Match Conclusion & Ledger Audit';
      helperText = 'Match clock reached 00:00! Review provisional standings below, resolve any tiebreak pitches, and click "Finalize Match".';
    }
  }

  // Display status label
  const displayStatus = isWaiting
    ? 'WAITING'
    : isLive
    ? 'LIVE'
    : isPaused
    ? 'PAUSED'
    : 'GAME OVER';

  return (
    <div className="bg-[#24334A] border-4 border-[#3E4F6D] shadow-[4px_4px_0px_#101A28] p-4 sm:p-5 flex flex-col gap-4 text-white">
      {/* 1. Header Bar: Title, Match Number, and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-[#3E4F6D] pb-3.5">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-xs bg-[#FFCC00] text-[#0A101D] px-2.5 py-1 border-2 border-[#1E294B] shadow-[2px_2px_0px_#050A14] font-bold uppercase">
            MATCH 1
          </span>
          <div>
            <h1 className="font-pixel text-sm sm:text-base text-white tracking-wide uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
              1. MATCH STATUS & CONTROL
            </h1>
            <span className="font-mono text-[11px] text-[#94A3B8]">
              ROOM CODE: <strong className="text-[#00F0FF] tracking-widest">{roomCode}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-[#94A3B8] uppercase">STATUS:</span>
          <StatusPill status={displayStatus} size="md" pulse={isLive} />
        </div>
      </div>

      {/* 2. Prominent Status Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#131E38] border-2 border-[#24355A] p-3.5 shadow-[2px_2px_0px_#050A14]">
        {/* Column 1: Current Status */}
        <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-[#24355A] pb-2 sm:pb-0 sm:pr-3">
          <span className="font-pixel text-[10px] text-[#94A3B8] uppercase tracking-wider block mb-1">
            CURRENT STATUS
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 border border-[#102040] ${
                isLive
                  ? 'bg-[#22C55E] animate-pulse'
                  : isPaused
                  ? 'bg-[#F59E0B]'
                  : isGameOver
                  ? 'bg-[#EF4444]'
                  : 'bg-[#3B82F6]'
              }`}
            />
            <span className="font-pixel text-xs sm:text-sm text-white font-black">
              {displayStatus}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#94A3B8] mt-1 truncate">
            {lifecycleState || normalizedStatus.toLowerCase()}
          </span>
        </div>

        {/* Column 2: Current Round / Phase */}
        <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-[#24355A] pb-2 sm:pb-0 sm:pr-3">
          <span className="font-pixel text-[10px] text-[#94A3B8] uppercase tracking-wider block mb-1">
            CURRENT PHASE
          </span>
          <span className="font-mono text-xs font-bold text-[#E2E8F0] leading-tight line-clamp-2">
            {phaseText}
          </span>
          <span className="font-pixel text-[9px] text-[#38BDF8] mt-1 font-bold">
            {isLive ? '★ LIVE TURNS ACTIVE' : isPaused ? '⏸ PAUSED' : isGameOver ? '⏹ ENDED' : '⌛ PRE-MATCH'}
          </span>
        </div>

        {/* Column 3: Active Team / Player Focus */}
        <div className="flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#24355A] pb-2 lg:pb-0 lg:pr-3">
          <span className="font-pixel text-[10px] text-[#94A3B8] uppercase tracking-wider block mb-1">
            ACTIVE TEAM FOCUS
          </span>
          <div className="flex items-center gap-2 truncate">
            {activeTeamColor && (
              <span
                className="w-3.5 h-3.5 border border-[#1E294B] flex-shrink-0"
                style={{ backgroundColor: activeTeamColor }}
              />
            )}
            <span className="font-pixel text-xs text-white truncate font-bold">
              {activeTeamName ? (
                <>Slot #{activeTeamSlot}: {activeTeamName}</>
              ) : (
                'Select a team'
              )}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#94A3B8] mt-1">
            {activeTeamName ? 'Selected for board transactions' : 'Click any team card below'}
          </span>
        </div>

        {/* Column 4: Countdown Timer */}
        <div className="flex flex-col items-center sm:items-start lg:items-center justify-center">
          <Countdown
            endsAt={endsAt}
            status={normalizedStatus}
            serverNow={serverNow}
            durationSeconds={durationSeconds}
            size="md"
            showLabel={true}
          />
        </div>
      </div>

      {/* 3. Short Helper Text */}
      <div className="bg-[#0D1527] border-2 border-[#1E2D4C] p-2.5 px-3.5 flex items-center gap-2.5">
        <span className="text-base flex-shrink-0">💡</span>
        <p className="font-mono text-xs text-[#93C5FD] leading-relaxed">
          <strong className="text-[#00F0FF]">NEXT STEP:</strong> {helperText}
        </p>
      </div>

      {/* 4. Game Controls Action Bar */}
      <div className="bg-[#070D1A] p-3 border-3 border-[#1E294B] shadow-[2px_2px_0px_#000] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-[#FFCC00] uppercase tracking-wider">
            GAME CONTROLS:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Start Game button */}
          <button
            type="button"
            onClick={onStartGame}
            disabled={!isWaiting || isActionLoading}
            className={`
              font-pixel text-[11px] uppercase px-3.5 py-2 border-2 transition-all cursor-pointer
              ${
                isWaiting
                  ? 'bg-[#22C55E] text-white border-white hover:bg-[#16A34A] shadow-[2px_2px_0px_#000] active:translate-y-0.5'
                  : 'bg-[#334155] text-[#94A3B8] border-[#475569] cursor-not-allowed opacity-60'
              }
            `}
            title={isWaiting ? 'Start match countdown (50:00)' : 'Game has already started'}
          >
            ▶ START GAME
          </button>

          {/* Pause Game button */}
          <button
            type="button"
            onClick={onPauseGame}
            disabled={!isLive || isActionLoading}
            className={`
              font-pixel text-[11px] uppercase px-3.5 py-2 border-2 transition-all cursor-pointer
              ${
                isLive
                  ? 'bg-[#F59E0B] text-[#102040] border-white hover:bg-[#D97706] hover:text-white shadow-[2px_2px_0px_#000] active:translate-y-0.5 font-bold'
                  : 'bg-[#334155] text-[#94A3B8] border-[#475569] cursor-not-allowed opacity-60'
              }
            `}
            title={isLive ? 'Pause match timer and operations' : 'Game must be running to pause'}
          >
            ⏸ PAUSE GAME
          </button>

          {/* Resume Game button */}
          <button
            type="button"
            onClick={onResumeGame}
            disabled={!isPaused || isActionLoading}
            className={`
              font-pixel text-[11px] uppercase px-3.5 py-2 border-2 transition-all cursor-pointer
              ${
                isPaused
                  ? 'bg-[#22C55E] text-white border-white hover:bg-[#16A34A] shadow-[2px_2px_0px_#000] active:translate-y-0.5'
                  : 'bg-[#334155] text-[#94A3B8] border-[#475569] cursor-not-allowed opacity-60'
              }
            `}
            title={isPaused ? 'Resume match and restart timer' : 'Game must be paused to resume'}
          >
            ⏯ RESUME GAME
          </button>

          {/* End Game button */}
          <button
            type="button"
            onClick={onEndGame}
            disabled={(!isLive && !isPaused) || isActionLoading}
            className={`
              font-pixel text-[11px] uppercase px-3.5 py-2 border-2 transition-all cursor-pointer
              ${
                isLive || isPaused
                  ? 'bg-[#D32F2F] text-white border-white hover:bg-[#B71C1C] shadow-[2px_2px_0px_#000] active:translate-y-0.5'
                  : 'bg-[#334155] text-[#94A3B8] border-[#475569] cursor-not-allowed opacity-60'
              }
            `}
            title={isLive || isPaused ? 'Conclude match immediately and freeze scores' : 'Match already ended or not started'}
          >
            ⏹ END GAME
          </button>

          {/* Abort / Reset button */}
          {onAbortGame && (
            <button
              type="button"
              onClick={onAbortGame}
              disabled={isActionLoading}
              className="font-pixel text-[10px] uppercase px-2.5 py-2 bg-transparent text-[#EF4444] hover:text-white hover:bg-[#7F1D1D] border border-[#EF4444] transition-all cursor-pointer"
              title="Reset match back to lobby"
            >
              ✕ ABORT TO LOBBY
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
