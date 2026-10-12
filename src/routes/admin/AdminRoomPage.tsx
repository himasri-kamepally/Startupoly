import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminRoom } from '../../data/useAdminRoom';
import {
  PixelCard,
  StatusPill,
  ConnectionPill,
  ErrorBanner,
  Skeleton,
  PixelBrickTile,
  AdminPatrolCharacter,
  AdminSkyBackground,
} from '../../ui';
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
    <div
      className="min-h-screen bg-gradient-to-b from-[#3B82F6] via-[#5C94FC] to-[#87CEEB] text-white flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Background Decor (Clouds, Sparkles, Birds, Faded Mountains) */}
      <AdminSkyBackground />

      {/* Top Navbar */}
      <header className="relative z-20 bg-gradient-to-r from-[#0B1326] via-[#111E3B] to-[#0D152A] text-white border-b-4 border-[#1E294B] px-4 py-3 flex items-center justify-between shadow-[0_4px_0px_#050810,0_2px_8px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="font-pixel text-[11px] bg-[#FFCC00] text-[#0A101D] hover:bg-[#F5BF00] px-3 py-1.5 border-2 border-[#1E294B] shadow-[2px_2px_0px_#050810] active:translate-y-0.5 transition-all inline-flex items-center gap-1.5 font-bold uppercase"
          >
            ◄ BACK TO ADMIN CONSOLE
          </Link>
          <span className="font-pixel text-xs text-white border-l-2 border-white/20 pl-3">
            ROOM {snapshot?.room.code || roomId?.slice(0, 6).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-mono text-[11px] text-[#94A3B8]">
            Updated: {lastUpdated}
          </span>
          <ConnectionPill status={connection} />
          {snapshot && <StatusPill status={snapshot.room.status} size="sm" />}
        </div>
      </header>

      {/* Responsive width notice for small devices (< 1024px) */}
      <div className="relative z-20 lg:hidden bg-[#FFCC00] text-[#102040] px-4 py-2 text-center border-b-4 border-[#102040] shadow-[0_2px_0px_#102040]">
        <p className="font-pixel text-[11px] leading-relaxed">
          💻 Use a laptop for the admin console. Full operations grid is optimized for screens ≥ 1024px.
        </p>
      </div>

      {/* Main Room Lifecycle Body */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
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

      {/* Mascot Patrol On Green Grass Platform & Brick Ground Base */}
      <div className="relative z-20 w-full">
        <AdminPatrolCharacter size={44} hasPlatform={false} />
        <PixelBrickTile hasGrass={true} className="h-8" />
      </div>
    </div>
  );
};
