import React, { useState } from 'react';
import { PixelButton, PixelCard, StatusPill, Modal, useToast } from '../../ui';
import { rpcAdminReleaseTeam, rpcAdminStartGame, AdminRoomSnapshot } from '../../data/rpc';

interface LobbyViewProps {
  snapshot: AdminRoomSnapshot;
  onRefetch: () => Promise<void>;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ snapshot, onRefetch }) => {
  const { room, teams } = snapshot;

  // Release modal state
  const [releasingTeam, setReleasingTeam] = useState<(typeof teams)[0] | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  // Start game modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { successToast, errorToast } = useToast();

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(room.code);
        setCopied(true);
        successToast(`Room code ${room.code} copied to clipboard!`);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const joinedTeams = teams.filter((t) => t.claimed);
  const unjoinedTeams = teams.filter((t) => !t.claimed);
  const allJoined = unjoinedTeams.length === 0;
  const noTeamsJoined = joinedTeams.length === 0;

  const handleRelease = async () => {
    if (!releasingTeam) return;
    try {
      setIsReleasing(true);
      await rpcAdminReleaseTeam(releasingTeam.id);
      successToast(`Slot #${releasingTeam.slot} (${releasingTeam.name}) released.`);
      setReleasingTeam(null);
      await onRefetch();
    } catch (err: any) {
      errorToast(err.message || 'Failed to release team slot.');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleStartGame = async (force: boolean) => {
    if (noTeamsJoined) {
      errorToast('Cannot start match: Players must join on their phones first.');
      return;
    }

    try {
      setIsStarting(true);
      await rpcAdminStartGame(room.id, force);
      successToast('Tournament match STARTED! 50-minute clock is ticking.');
      setShowStartModal(false);
      await onRefetch();
    } catch (err: any) {
      if (err.code === 'TEAMS_NOT_JOINED') {
        errorToast('Some teams have not joined yet. Connect all teams or force start.');
      } else {
        errorToast(err.message || 'Failed to start game.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Projector Hero Card - Balanced and Compact */}
      <PixelCard
        title="LIVE TOURNAMENT LOBBY • PROJECTOR VIEW"
        headerBg="navy"
        variant="cream"
        padding="md"
        className="text-center shadow-[4px_4px_0px_#102040] shrink-0"
      >
        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
          <span className="font-pixel text-[10px] sm:text-xs uppercase tracking-widest text-[#102040] font-bold">
            ROOM CODE TO JOIN ON PHONES
          </span>

          {/* Balanced room code with neatly aligned copy button */}
          <div className="my-1 flex flex-col sm:flex-row items-stretch justify-center gap-2.5 w-full max-w-lg mx-auto">
            <div className="bg-[#FFCC00] border-4 border-[#102040] shadow-[3px_3px_0px_#102040] px-5 sm:px-8 py-2 sm:py-2.5 flex items-center justify-center flex-1">
              <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] text-[#102040] select-all leading-none">
                {room.code}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy room code"
              className="font-pixel text-xs sm:text-sm bg-[#FAF8F5] text-[#102040] hover:bg-[#FFCC00] px-4 py-2 sm:py-2.5 border-4 border-[#102040] shadow-[3px_3px_0px_#102040] font-bold flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 cursor-pointer select-none shrink-0"
            >
              <span>{copied ? '✓ COPIED!' : '📋 COPY CODE'}</span>
            </button>
          </div>

          <p className="font-mono text-xs text-[#102040] font-semibold">
            Players navigate to <strong className="underline font-bold">/join</strong> on their phone, enter the code above, select their slot, and input their PIN.
          </p>
        </div>

        {/* Live Joined Tracker Bar */}
        <div className="mt-2.5 pt-2.5 border-t-2 border-[#102040] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-start">
            <span className="font-pixel text-xs text-[#102040] font-bold">
              STATUS:
            </span>
            <span
              className={`font-pixel text-xs px-3 py-1 border-2 border-[#102040] shadow-[2px_2px_0px_#102040] ${
                allJoined
                  ? 'bg-[#DCFCE7] text-[#166534]'
                  : joinedTeams.length > 0
                  ? 'bg-[#FEF9C3] text-[#854D0E]'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {joinedTeams.length} / {teams.length} TEAMS CONNECTED
            </span>
          </div>

          <PixelButton
            variant={allJoined ? 'primary' : noTeamsJoined ? 'ghost' : 'secondary'}
            size="md"
            onClick={() => setShowStartModal(true)}
            className="w-full sm:w-auto"
          >
            {allJoined ? 'START GAME (50:00)' : 'START GAME...'}
          </PixelButton>
        </div>
      </PixelCard>

      {/* Team Cards Grid with PINs and Connection Status */}
      <PixelCard
        title="TEAM CONNECTIONS & SECRET PINS"
        headerBg="brick"
        padding="sm"
        className="min-h-0 flex-1 flex flex-col"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] lg:max-h-[330px] overflow-y-auto pr-1">
          {teams.map((team) => {
            const isConnected = team.claimed;
            return (
              <div
                key={team.id}
                className={`
                  border-3 p-2.5 sm:p-3 shadow-[3px_3px_0px_#102040] flex flex-col justify-between gap-2 transition-all
                  ${
                    isConnected
                      ? 'bg-[#F0FDF4] border-[#16A34A] shadow-[3px_3px_0px_#166534]'
                      : 'bg-white border-[#102040]'
                  }
                `}
              >
                {/* Header: Slot & Connection Pill */}
                <div className="flex items-center justify-between border-b-2 border-[#102040] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 border-2 border-[#102040] shadow-[1px_1px_0px_#102040]"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-pixel text-[11px] sm:text-xs text-[#102040] font-bold">
                      SLOT #{team.slot}
                    </span>
                  </div>

                  <StatusPill
                    status={isConnected ? 'CONNECTED' : 'WAITING'}
                    size="sm"
                    pulse={!isConnected}
                  />
                </div>

                {/* Team Name */}
                <div>
                  <h3 className="font-pixel text-xs sm:text-sm text-[#102040] truncate">
                    {team.name}
                  </h3>
                </div>

                {/* PIN and Release Action */}
                <div className="bg-[#FAF8F5] border-2 border-[#102040] px-2.5 py-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-pixel text-[8px] text-[#102040] font-bold block uppercase">
                      SECRET PIN:
                    </span>
                    <span className="font-mono font-extrabold text-base sm:text-lg text-[#102040] tracking-widest leading-tight">
                      {team.pin || '••••'}
                    </span>
                  </div>

                  {isConnected && (
                    <PixelButton
                      variant="danger"
                      size="sm"
                      onClick={() => setReleasingTeam(team)}
                      className="text-[9px] min-h-[30px] py-0.5 px-2.5"
                      title="Disconnect this team's device"
                    >
                      RELEASE
                    </PixelButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PixelCard>

      {/* Confirmation Modal to Release Team Device */}
      <Modal
        isOpen={Boolean(releasingTeam)}
        onClose={() => setReleasingTeam(null)}
        title="RELEASE TEAM CONNECTION"
        footer={
          <>
            <PixelButton
              variant="ghost"
              size="md"
              onClick={() => setReleasingTeam(null)}
              disabled={isReleasing}
            >
              CANCEL
            </PixelButton>
            <PixelButton
              variant="danger"
              size="md"
              onClick={handleRelease}
              isLoading={isReleasing}
            >
              RELEASE DEVICE
            </PixelButton>
          </>
        }
      >
        {releasingTeam && (
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <p className="font-mono text-sm leading-relaxed text-[#102040]">
              Are you sure you want to disconnect the active device for{' '}
              <strong>Slot #{releasingTeam.slot} ({releasingTeam.name})</strong>?
            </p>
            <div className="bg-[#FEF2F2] border-2 border-[#102040] p-3 text-xs text-[#991B1B] font-mono">
              ⚠ The current phone session will be invalidated. The team will need to re-enter their PIN ({releasingTeam.pin}) to reconnect.
            </div>
          </div>
        )}
      </Modal>

      {/* Modal to Start Game: Blocks when 0 teams, warns when partial, confirms when all */}
      <Modal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title={
          noTeamsJoined
            ? 'CANNOT START: NO TEAMS CONNECTED'
            : allJoined
            ? 'CONFIRM START GAME'
            : 'UNJOINED TEAMS WARNING'
        }
        footer={
          noTeamsJoined ? (
            <PixelButton
              variant="primary"
              size="md"
              onClick={() => setShowStartModal(false)}
            >
              GOT IT / CLOSE
            </PixelButton>
          ) : (
            <>
              <PixelButton
                variant="ghost"
                size="md"
                onClick={() => setShowStartModal(false)}
                disabled={isStarting}
              >
                CANCEL
              </PixelButton>
              {allJoined ? (
                <PixelButton
                  variant="primary"
                  size="md"
                  onClick={() => handleStartGame(false)}
                  isLoading={isStarting}
                >
                  START 50:00 MATCH
                </PixelButton>
              ) : (
                <PixelButton
                  variant="danger"
                  size="md"
                  onClick={() => handleStartGame(true)}
                  isLoading={isStarting}
                >
                  START ANYWAY (FORCE)
                </PixelButton>
              )}
            </>
          )
        }
      >
        {noTeamsJoined ? (
          <div className="flex flex-col items-center text-center gap-3 py-1">
            <div className="w-12 h-12 bg-[#FEF2F2] border-3 border-[#102040] shadow-[2px_2px_0px_#102040] flex items-center justify-center text-2xl shrink-0">
              🚫
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <h3 className="font-pixel text-xs sm:text-sm text-[#991B1B]">
                0 / {teams.length} TEAMS CONNECTED
              </h3>
              <p className="font-mono text-xs leading-relaxed text-[#102040]">
                Startupoly requires competing teams to connect their devices before starting the match.
              </p>
              <div className="bg-[#FFFBEB] border-2 border-[#102040] p-2.5 text-xs text-[#92400E] font-mono text-left mt-0.5">
                <p className="font-bold mb-1 font-pixel text-[10px] text-[#102040]">HOW PLAYERS CONNECT:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Navigate to <strong className="underline">/join</strong> on phone</li>
                  <li>Enter room code: <strong className="font-mono text-sm text-[#102040]">{room.code}</strong></li>
                  <li>Select team slot (1–{teams.length})</li>
                  <li>Enter their slot's secret 4-digit PIN</li>
                </ol>
              </div>
            </div>
          </div>
        ) : allJoined ? (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm leading-relaxed text-[#102040]">
              All <strong>{teams.length} teams</strong> have connected their phones!
            </p>
            <div className="bg-[#DCFCE7] border-2 border-[#102040] p-3 text-xs text-[#166534] font-mono">
              ★ Starting the match will activate the 50-minute tournament clock for all players and project the live scoreboard.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-sm leading-relaxed text-[#102040]">
              Warning: <strong>{unjoinedTeams.length} out of {teams.length} teams</strong> have not connected yet:
            </p>

            <div className="bg-[#FEF2F2] border-2 border-[#102040] p-3 flex flex-col gap-1.5">
              {unjoinedTeams.map((t) => (
                <div key={t.id} className="flex items-center gap-2 font-mono text-xs text-[#991B1B] font-bold">
                  <span
                    className="w-3 h-3 border border-[#102040]"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>Slot #{t.slot}: {t.name} (PIN: {t.pin})</span>
                </div>
              ))}
            </div>

            <p className="font-mono text-xs text-[#64748B]">
              You can wait for players to connect, or click <strong>Start anyway (Force)</strong> to begin. Unconnected teams can still join later with their PIN.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
