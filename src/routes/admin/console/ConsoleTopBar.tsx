import React from 'react';
import { Link } from 'react-router-dom';
import { Countdown, ConnectionPill } from '../../../ui';
import { ConnectionStatus } from '../../../ui/ConnectionPill';

export interface ConsoleTopBarProps {
  roomCode: string;
  status: string;
  endsAt: string | null;
  serverNow?: string | null;
  connection: ConnectionStatus;
  lastUpdated: string;
  onRefetch?: () => void;
  isRefetching?: boolean;
  onAbortGame?: () => void;
  onExtendGame?: (seconds?: number) => void;
  isExtending?: boolean;
  onOpenPitchTimer?: () => void;
  onOpenWildcard?: () => void;
}

export const ConsoleTopBar: React.FC<ConsoleTopBarProps> = ({
  roomCode,
  status,
  endsAt,
  serverNow,
  connection,
  lastUpdated,
  onRefetch,
  isRefetching = false,
  onAbortGame,
  onExtendGame,
  isExtending = false,
  onOpenPitchTimer,
  onOpenWildcard,
}) => {
  // Map internal room status to clear organizer-facing match phase text
  const getMatchPhaseInfo = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return {
          phaseLabel: 'MATCH IN PROGRESS',
          phaseSub: 'Live Gameplay (50:00)',
          badgeBg: 'bg-[#22B14C]',
          badgeText: 'text-white',
          border: 'border-[#102040]',
          icon: '▶',
        };
      case 'TIME_EXPIRED':
        return {
          phaseLabel: 'MATCH ENDED (POST-MATCH)',
          phaseSub: 'Post-Match Reconciliation',
          badgeBg: 'bg-[#FFCC00]',
          badgeText: 'text-[#102040]',
          border: 'border-[#102040]',
          icon: '⏱',
        };
      case 'FINALIZED':
        return {
          phaseLabel: 'TOURNAMENT ARCHIVED',
          phaseSub: 'Official Results Locked',
          badgeBg: 'bg-[#8B5CF6]',
          badgeText: 'text-white',
          border: 'border-[#102040]',
          icon: '★',
        };
      case 'PAUSED':
        return {
          phaseLabel: 'MATCH PAUSED',
          phaseSub: 'Timer Stopped',
          badgeBg: 'bg-[#F97316]',
          badgeText: 'text-white',
          border: 'border-[#102040]',
          icon: '⏸',
        };
      case 'LOBBY':
        return {
          phaseLabel: 'LOBBY OPEN',
          phaseSub: 'Waiting for Players',
          badgeBg: 'bg-[#EAB308]',
          badgeText: 'text-[#102040]',
          border: 'border-[#102040]',
          icon: '📱',
        };
      case 'CREATED':
      default:
        return {
          phaseLabel: 'ROOM SETUP',
          phaseSub: 'Pre-Lobby Configuration',
          badgeBg: 'bg-[#3B82F6]',
          badgeText: 'text-white',
          border: 'border-[#102040]',
          icon: '⚙',
        };
    }
  };

  const phase = getMatchPhaseInfo(status);

  return (
    <header className="bg-[#102040] text-white border-b-4 border-[#102040] px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_0px_#102040]">
      {/* Left section: Back navigation, Room code & Authoritative Match Phase */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <Link
          to="/admin"
          className="font-pixel text-xs text-[#FFCC00] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]"
          aria-label="Back to admin tournament rooms"
        >
          ◄ CONSOLE
        </Link>

        {/* Room Code Badge */}
        <div className="border-l-2 border-white/20 pl-2 sm:pl-3 flex items-center gap-2">
          <div className="bg-[#FFCC00] text-[#102040] px-2.5 py-1 border-2 border-[#102040] shadow-[2px_2px_0px_rgba(0,0,0,0.4)] flex items-center gap-1.5 font-pixel text-xs text-[#102040]">
            <span className="font-bold tracking-wider">ROOM {roomCode}</span>
          </div>

          {/* Prominent Match State Badge */}
          <div
            className={`
              flex items-center gap-1.5 px-2.5 py-1 border-2 font-pixel text-[10px] uppercase
              shadow-[2px_2px_0px_rgba(0,0,0,0.3)]
              ${phase.badgeBg} ${phase.badgeText} ${phase.border}
            `}
            title={phase.phaseSub}
          >
            <span>{phase.icon}</span>
            <span>{phase.phaseLabel}</span>
          </div>
        </div>

        {onAbortGame && (
          <div className="border-l-2 border-white/20 pl-2 sm:pl-3">
            <button
              onClick={onAbortGame}
              className="font-pixel text-[10px] bg-[#D32F2F] text-white px-2.5 py-1.5 border-2 border-white/30 hover:bg-[#B71C1C] active:translate-y-0.5 transition-colors cursor-pointer uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              title="Abort game and return to lobby"
            >
              ✕ ABORT GAME
            </button>
          </div>
        )}
      </div>

      {/* Center section: Authoritative Server-Clock Countdown with explicit status label & Game Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mx-auto sm:mx-0">
        <div className="flex flex-col items-center">
          <span className="font-pixel text-[8px] uppercase tracking-wider text-[#94A3B8]">
            {status === 'ACTIVE'
              ? 'MATCH CLOCK (50:00)'
              : status === 'TIME_EXPIRED'
              ? 'SCORES FROZEN (00:00)'
              : 'COUNTDOWN'}
          </span>
          <Countdown
            endsAt={endsAt}
            status={status}
            serverNow={serverNow}
            size="lg"
            showLabel={false}
            className="scale-90 sm:scale-100"
          />
        </div>

        {/* Action Controls: Overtime, Pitch Timer & Wildcard */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {onExtendGame && (status === 'ACTIVE' || status === 'TIME_EXPIRED') && (
            <button
              type="button"
              onClick={() => onExtendGame(600)}
              disabled={isExtending}
              title="Add 10 minutes overtime"
              aria-label="Add 10 minutes overtime"
              className="font-pixel text-[10px] bg-[#22B14C] text-white hover:bg-[#166534] px-2.5 py-1.5 border-2 border-[#102040] shadow-[1px_1px_0px_#102040] font-bold active:translate-y-0.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isExtending ? '…' : '+10 MIN'}
            </button>
          )}
          {onOpenPitchTimer && (
            <button
              type="button"
              onClick={onOpenPitchTimer}
              title="Open 30s Pitch Tiebreaker Clock"
              aria-label="Open 30s Pitch Clock"
              className="font-pixel text-[10px] bg-[#FAF8F5] text-[#102040] hover:bg-[#FFCC00] px-2 py-1.5 border-2 border-[#102040] shadow-[1px_1px_0px_#102040] font-bold active:translate-y-0.5 transition-colors cursor-pointer"
            >
              ⏱ 30s PITCH
            </button>
          )}
          {onOpenWildcard && (
            <button
              type="button"
              onClick={onOpenWildcard}
              title="Spin a Wildcard Challenge Task"
              aria-label="Open Wildcard Challenge"
              className="font-pixel text-[10px] bg-[#FEF08A] text-[#102040] hover:bg-[#FFCC00] px-2 py-1.5 border-2 border-[#102040] shadow-[1px_1px_0px_#102040] font-bold active:translate-y-0.5 transition-colors cursor-pointer"
            >
              ⚡ WILDCARD
            </button>
          )}
        </div>
      </div>

      {/* Right section: Connection & sync status (clearly labeled to distinguish from match gameplay) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline font-pixel text-[8px] text-[#94A3B8] uppercase">
              ROOM SYNC:
            </span>
            <ConnectionPill status={connection} lastUpdated={lastUpdated} />
          </div>
          <span className="hidden lg:inline font-mono text-[10px] text-[#94A3B8] mt-0.5">
            Updated: {lastUpdated}
          </span>
        </div>

        {onRefetch && (
          <button
            onClick={onRefetch}
            disabled={isRefetching}
            title="Refresh room snapshot now"
            aria-label="Refresh room snapshot"
            className="w-8 h-8 flex items-center justify-center bg-[#FAF8F5] text-[#102040] border-2 border-[#102040] font-pixel text-xs hover:bg-[#FFCC00] transition-colors cursor-pointer disabled:opacity-50 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]"
          >
            {isRefetching ? '…' : '↻'}
          </button>
        )}
      </div>
    </header>
  );
};

