import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminRoom } from '../../data/useAdminRoom';
import { PixelCard, ConnectionPill, ErrorBanner, Skeleton, PixelBrickTile } from '../../ui';
import { SetupView } from './SetupView';
import { LobbyView } from './LobbyView';
import { ActiveSummaryView } from './ActiveSummaryView';
import { AdminConsoleView } from './console';

export const AdminRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { snapshot, status, error, refetch, connection, lastUpdated, isStale, staleAgeSeconds } = useAdminRoom(roomId);

  if (
    status === 'ready' &&
    snapshot &&
    (snapshot.room.status === 'ACTIVE' ||
      snapshot.room.status === 'PAUSED' ||
      snapshot.room.status === 'TIME_EXPIRED' ||
      snapshot.room.status === 'FINALIZED')
  ) {
    return (
      <AdminConsoleView
        snapshot={snapshot}
        onRefetch={refetch}
        connection={connection}
        lastUpdated={lastUpdated}
        isStale={isStale}
        staleAgeSeconds={staleAgeSeconds}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#5C94FC] flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <header className="bg-[#102040] text-white border-b-4 border-[#102040] px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-3 shadow-[0_4px_0px_#102040] select-none shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to="/admin"
            className="font-pixel text-[11px] sm:text-xs text-[#FFCC00] bg-[#1a2e5a] hover:bg-[#253f7a] border-2 border-[#FFCC00] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] px-2.5 py-1 flex items-center gap-1.5 transition-transform active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]"
            title="Return to Admin Management Console"
          >
            <span>◄</span>
            <span>CONSOLE</span>
          </Link>
          <div className="border-l-2 border-white/20 pl-2 sm:pl-3 flex items-center gap-2 flex-wrap">
            <div className="bg-[#FFCC00] text-[#102040] px-2 py-0.5 sm:px-2.5 sm:py-1 border-2 border-[#102040] shadow-[2px_2px_0px_rgba(0,0,0,0.4)] font-pixel text-xs font-bold tracking-wider">
              ROOM {snapshot?.room.code || roomId?.slice(0, 6).toUpperCase()}
            </div>
            {snapshot && (
              <span className="font-pixel text-[9px] sm:text-[10px] bg-[#3B82F6] text-white px-2 py-0.5 sm:py-1 border border-white/30 uppercase tracking-wide">
                {snapshot.room.status === 'CREATED'
                  ? '⚙ PRE-LOBBY SETUP'
                  : snapshot.room.status === 'LOBBY'
                  ? '📱 LOBBY (PLAYERS JOINING)'
                  : snapshot.room.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline font-mono text-[11px] text-[#94A3B8]">
            Updated: {lastUpdated}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline font-pixel text-[8px] text-[#94A3B8] uppercase">
              ROOM SYNC:
            </span>
            <ConnectionPill status={connection} />
          </div>
        </div>
      </header>

      {/* Responsive width notice for small devices (< 1024px) */}
      <div className="lg:hidden bg-[#FFCC00] text-[#102040] px-3 py-1.5 text-center border-b-4 border-[#102040] shadow-[0_2px_0px_#102040] shrink-0">
        <p className="font-pixel text-[10px] leading-relaxed">
          📱 Phone view active. Scroll down to view team slots and PINs.
        </p>
      </div>

      {/* Main Room Lifecycle Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-3 md:p-4 flex flex-col gap-2 sm:gap-2.5 min-h-0">
        {status === 'loading' && (
          <div className="flex flex-col gap-4">
            <PixelCard title="LOADING TOURNAMENT ROOM..." headerBg="navy">
              <div className="flex flex-col gap-4 py-6">
                <Skeleton height={60} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton height={140} />
                  <Skeleton height={140} />
                  <Skeleton height={140} />
                </div>
              </div>
            </PixelCard>
          </div>
        )}

        {status === 'error' && (
          <div className="my-auto">
            <ErrorBanner
              message={error?.message || 'Failed to connect to tournament room.'}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {status === 'ready' && snapshot && (
          <>
            {snapshot.room.status === 'CREATED' && (
              <SetupView snapshot={snapshot} onRefetch={refetch} />
            )}

            {snapshot.room.status === 'LOBBY' && (
              <LobbyView snapshot={snapshot} onRefetch={refetch} />
            )}

            {(snapshot.room.status === 'ACTIVE' ||
              snapshot.room.status === 'TIME_EXPIRED' ||
              snapshot.room.status === 'FINALIZED') && (
              <ActiveSummaryView snapshot={snapshot} />
            )}
          </>
        )}
      </main>

      {/* Brick Ground Base */}
      <PixelBrickTile hasGrass={true} className="h-8" />
    </div>
  );
};
