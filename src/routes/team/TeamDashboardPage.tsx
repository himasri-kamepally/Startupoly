import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMyTeam } from '../../data/useMyTeam';
import { useOptionalAuth } from '../../data/auth';
import {
  ConnectionPill,
  StatusPill,
  Skeleton,
  PixelCard,
  TeamPatrolCharacter,
  AdminSkyBackground,
  PixelBrickTile,
} from '../../ui';
import { LobbyWaitView } from './LobbyWaitView';
import { ActiveDashboardView } from './ActiveDashboardView';
import { GameOverView } from './GameOverView';
import { FinalBoardView } from './FinalBoardView';

export const TeamDashboardPage: React.FC = () => {
  const {
    state,
    status,
    refetch,
    connection,
    lastUpdatedAt,
    isStale,
    staleAgeSeconds,
    cashFlash,
    cvFlash,
    wasClaimReleased,
    isSessionLost,
  } = useMyTeam();

  const auth = useOptionalAuth();
  const isAdmin = auth?.isAdmin ?? false;

  // If anonymous session was lost, redirect to /join with notice
  if (isSessionLost) {
    return (
      <Navigate
        to="/join"
        state={{ notice: 'Session expired. Please rejoin with your room code and PIN.' }}
        replace
      />
    );
  }

  // If claim was released by admin, redirect to /join with notice
  if (wasClaimReleased) {
    return (
      <Navigate
        to="/join"
        state={{ notice: 'Ask the organiser to rejoin you' }}
        replace
      />
    );
  }

  // If initial load in progress, show skeleton (never flash join screen)
  if (status === 'loading' && !state) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-[#3B82F6] via-[#5C94FC] to-[#87CEEB] flex flex-col justify-between p-4 relative overflow-hidden select-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <AdminSkyBackground />
        <header className="relative z-20 bg-[#102040] p-3 border-4 border-[#102040] shadow-[3px_3px_0px_#102040] flex items-center justify-between">
          <Skeleton height={20} width={120} />
          <Skeleton height={20} width={60} />
        </header>

        <main className="relative z-10 max-w-md w-full mx-auto my-auto flex flex-col gap-4">
          <PixelCard title="SYNCING TEAM DATA..." headerBg="navy">
            <div className="flex flex-col gap-3 py-4">
              <Skeleton height={60} />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton height={80} />
                <Skeleton height={80} />
              </div>
              <Skeleton height={120} />
            </div>
          </PixelCard>
        </main>

        <div className="relative z-20 w-full">
          <PixelBrickTile hasGrass={true} className="h-6 w-full" />
        </div>
      </div>
    );
  }

  // If ready and no team claim exists on this session, redirect to /join
  if (!state && status === 'ready') {
    return <Navigate to="/join" replace />;
  }

  if (!state) {
    return <Navigate to="/join" replace />;
  }

  const { team, room } = state;
  const hasStarted = room.started_at !== null;
  const normalizedStatus = room.status.toUpperCase();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#3B82F6] via-[#5C94FC] to-[#87CEEB] flex flex-col justify-between selection:bg-[#FFCC00] selection:text-[#102040] relative overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Background Decor (Parallax Clouds, Stars, Distant Mountains) */}
      <AdminSkyBackground />

      {/* Admin Mode Top Banner */}
      {isAdmin && (
        <div className="relative z-20 bg-[#102040] text-white border-b-2 border-[#FFCC00] px-3 py-1.5 flex items-center justify-between shadow-[0_2px_0px_#102040]">
          <span className="font-pixel text-[10px] text-[#FFCC00] flex items-center gap-1.5">
            👑 ADMIN PREVIEW MODE
          </span>
          <Link
            to="/admin"
            className="font-pixel text-[10px] bg-[#FFCC00] text-[#102040] hover:bg-[#F5BF00] px-2.5 py-1 border border-[#102040] shadow-[1px_1px_0px_#102040] font-bold uppercase transition-all"
            title="Return to Admin Console"
          >
            ◄ BACK TO ADMIN CONSOLE
          </Link>
        </div>
      )}

      {/* Mobile Top Navigation */}
      <header className="bg-[#102040] text-white border-b-4 border-[#102040] p-3 shadow-[0_3px_0px_#102040] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 truncate">
          <span
            className="w-4 h-4 border-2 border-white shadow-[1px_1px_0px_#102040] flex-shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <div className="truncate">
            <span className="font-pixel text-xs text-[#FFCC00] block truncate">
              {team.name}
            </span>
            <span className="font-mono text-[10px] text-[#94A3B8]">
              SLOT #{team.slot}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ConnectionPill status={connection} lastUpdated={lastUpdatedAt} showLabel={false} />
          <StatusPill status={hasStarted ? normalizedStatus : 'WAITING'} size="sm" />
        </div>
      </header>

      {/* Offline / Reconnecting Banner (> 20s stale) */}
      {isStale && (
        <div className="relative z-20 bg-[#FEF9C3] text-[#854D0E] border-b-3 border-[#102040] px-3 py-1.5 text-center font-mono text-xs font-bold animate-pulse">
          ⚠ Reconnecting… last update {staleAgeSeconds}s ago (values preserved)
        </div>
      )}

      {/* Main Single-Column Content (Mobile First 360-430px) */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {/*
          CRITICAL INITIALIZATION GUARD:
          If the match has not actually started (started_at is null) or status is LOBBY/CREATED,
          the view is ALWAYS LobbyWaitView (Waiting for game to start), NEVER GameOverView!
        */}
        {(!hasStarted || normalizedStatus === 'LOBBY' || normalizedStatus === 'CREATED') && (
          <LobbyWaitView state={state} />
        )}

        {hasStarted && (normalizedStatus === 'ACTIVE' || normalizedStatus === 'PAUSED') && (
          <ActiveDashboardView
            state={state}
            onExpire={() => refetch()}
            cashFlash={cashFlash}
            cvFlash={cvFlash}
          />
        )}

        {hasStarted && normalizedStatus === 'TIME_EXPIRED' && (
          <GameOverView state={state} />
        )}

        {normalizedStatus === 'FINALIZED' && (
          <FinalBoardView state={state} />
        )}
      </main>

      {/* Mascot Patrol On Green Grass Platform & Brick Ground Base */}
      <div className="relative z-20 w-full">
        <TeamPatrolCharacter size={44} hasPlatform={false} />
        <PixelBrickTile hasGrass={true} className="h-6 w-full" />
      </div>
    </div>
  );
};
