import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../data/auth';
import { supabase } from '../../data/client';
import { rpcAdminClearMatchData } from '../../data/rpc';
import { clearAllLocalMatchStates } from '../../domain/matchState';
import { PixelButton, PixelBrickTile, Modal, PixelLoader, ErrorBanner, StatusPill, useToast } from '../../ui';
import { CreateRoomView } from './CreateRoomView';

interface ActiveRoomInfo {
  id: string;
  code: string;
  status: string;
  team_count: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { successToast, errorToast } = useToast();
  const [checkingActiveRoom, setCheckingActiveRoom] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ActiveRoomInfo | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [roomCheckError, setRoomCheckError] = useState<string | null>(null);
  const [checkAttempt, setCheckAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function checkCurrentRoom() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('id, code, status, team_count')
          .neq('status', 'FINALIZED')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }
        if (data && isMounted) {
          setActiveRoom(data as ActiveRoomInfo);
        }
      } catch (err) {
        console.warn('Failed to check active room:', err);
        if (isMounted) {
          setRoomCheckError('Unable to verify the current match room. Check the connection before creating another room.');
        }
      } finally {
        if (isMounted) {
          setCheckingActiveRoom(false);
        }
      }
    }

    checkCurrentRoom();
    return () => {
      isMounted = false;
    };
  }, [checkAttempt]);

  const handleClearMatchData = async () => {
    try {
      setIsClearing(true);
      await rpcAdminClearMatchData();
      clearAllLocalMatchStates();
      setActiveRoom(null);
      setClearConfirmOpen(false);
      successToast('Match data cleared and archived. You can now start a fresh tournament!');
      setCheckAttempt((a) => a + 1);
    } catch (err: any) {
      errorToast(err.message || 'Failed to clear match data.');
    } finally {
      setIsClearing(false);
    }
  };

  if (checkingActiveRoom) {
    return <PixelLoader label="CHECKING MATCH STATE..." delayMs={0} />;
  }

  return (
    <div className="min-h-screen bg-nes-sky flex flex-col justify-between">
      {/* Admin Top Navigation */}
      <header className="bg-nes-navy text-white border-b-4 border-nes-navy px-4 py-3 flex items-center justify-between shadow-[0_4px_0px_#102040]">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-sm text-nes-gold">STARTUPOLY</span>
          <span className="hidden sm:inline font-mono text-xs text-nes-gray border-l-2 border-white/20 pl-3">
            ADMIN CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:inline font-mono text-xs text-[#94A3B8]">
            {user?.email}
          </span>
          <PixelButton
            variant="ghost"
            size="sm"
            onClick={() => setClearConfirmOpen(true)}
            title="Clear all past matches to start fresh"
          >
            RESET MATCHES
          </PixelButton>
          <Link to="/admin/history">
            <PixelButton variant="ghost" size="sm">
              HISTORY
            </PixelButton>
          </Link>
          <PixelButton variant="danger" size="sm" onClick={() => setLogoutConfirmOpen(true)}>
            LOGOUT
          </PixelButton>
        </div>
      </header>

      {/* Responsive width notice for small devices (< 1024px) */}
      <div className="lg:hidden bg-nes-gold text-nes-navy px-4 py-2 text-center border-b-4 border-nes-navy shadow-[0_2px_0px_#102040]">
        <p className="font-pixel text-[11px] leading-relaxed">
          💻 Use a laptop for the admin console. Full operations grid is optimized for screens ≥ 1024px.
        </p>
      </div>

      {/* Main Container: Active Room Card & Create Room View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {roomCheckError ? (
          <ErrorBanner
            message={roomCheckError}
            onRetry={() => {
              setRoomCheckError(null);
              setCheckingActiveRoom(true);
              setCheckAttempt((attempt) => attempt + 1);
            }}
          />
        ) : (
          <>
            {activeRoom && (
              <div className="bg-[#FAF8F5] border-4 border-[#102040] shadow-[6px_6px_0px_#102040] p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[10px] bg-[#FFCC00] text-[#102040] px-2 py-0.5 border border-[#102040] font-bold">
                        ACTIVE TOURNAMENT ROOM
                      </span>
                      <StatusPill
                        status={activeRoom.status}
                        size="sm"
                        pulse={activeRoom.status === 'LOBBY' || activeRoom.status === 'ACTIVE'}
                      />
                    </div>
                    <h2 className="font-pixel text-lg sm:text-xl text-[#102040]">
                      ROOM CODE: <span className="font-mono text-xl sm:text-2xl text-[#E52521] tracking-wider font-extrabold">{activeRoom.code}</span>
                    </h2>
                    <p className="font-mono text-xs text-[#64748B] font-semibold">
                      {activeRoom.team_count} Teams • State: {activeRoom.status === 'LOBBY' ? 'Lobby (Waiting for phone players)' : activeRoom.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link to={`/admin/room/${activeRoom.id}`} className="w-full sm:w-auto">
                      <PixelButton variant="primary" size="lg" className="w-full sm:w-auto">
                        ► RESUME ROOM CONSOLE
                      </PixelButton>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <CreateRoomView />
          </>
        )}
      </main>

      {/* Brick Ground Base */}
      <PixelBrickTile hasGrass={true} className="h-8" />

      {/* Logout confirm — requires explicit confirmation before calling logout() */}
      <Modal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="CONFIRM LOGOUT"
        maxWidth="sm"
        footer={
          <>
            <PixelButton variant="ghost" size="sm" onClick={() => setLogoutConfirmOpen(false)}>
              CANCEL
            </PixelButton>
            <PixelButton
              variant="danger"
              size="sm"
              onClick={async () => {
                setLogoutConfirmOpen(false);
                await logout();
              }}
            >
              LOG OUT
            </PixelButton>
          </>
        }
      >
        <p className="font-mono text-sm text-nes-navy">
          Are you sure you want to log out of the admin console?
        </p>
      </Modal>

      {/* Clear Matches confirmation */}
      <Modal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="START FRESH: CLEAR MATCH DATA"
        maxWidth="md"
        footer={
          <>
            <PixelButton
              variant="ghost"
              size="sm"
              onClick={() => setClearConfirmOpen(false)}
              disabled={isClearing}
            >
              CANCEL
            </PixelButton>
            <PixelButton
              variant="danger"
              size="sm"
              onClick={handleClearMatchData}
              isLoading={isClearing}
            >
              CLEAR & START FRESH
            </PixelButton>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="font-mono text-sm leading-relaxed text-[#102040]">
            Are you sure you want to remove past match data and start fresh?
          </p>
          <div className="bg-[#FFFBEB] border-2 border-[#102040] p-3 text-xs text-[#92400E] font-mono flex flex-col gap-1.5">
            <p className="font-bold">✓ Preserved Safely:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Admin user account ({user?.email}) & login credentials</li>
              <li>Official Startupoly business catalog (10 companies)</li>
              <li>Database tables, types, and security policies</li>
            </ul>
          </div>
          <div className="bg-[#FEF2F2] border-2 border-[#102040] p-3 text-xs text-[#991B1B] font-mono flex flex-col gap-1.5">
            <p className="font-bold">⚠ Cleared & Archived:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>All existing match records are archived into the backup table</li>
              <li>Old rooms, teams, cash, scores, and activity logs are deleted</li>
              <li>Local browser match storage is cleared</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
