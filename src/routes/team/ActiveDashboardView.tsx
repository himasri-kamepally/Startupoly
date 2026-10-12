import React from 'react';
import { PixelCard, Countdown, EmptyState } from '../../ui';
import { PixelCoin, PixelLevelPips, PixelBusinessIcon } from '../../ui/pixel';
import { formatINR } from '../../lib/format';
import { TeamStateResponse } from '../../data/rpc';
import { FlashDirection } from '../../data/useMyTeam';
import { getBoardSpace } from '../../domain/board';
import { loadMatchState } from '../../domain/matchState';

interface ActiveDashboardViewProps {
  state: TeamStateResponse;
  onExpire: () => void;
  cashFlash: FlashDirection;
  cvFlash: FlashDirection;
}

export const ActiveDashboardView: React.FC<ActiveDashboardViewProps> = ({
  state,
  onExpire,
  cashFlash,
  cvFlash,
}) => {
  const { team, room, businesses, leaderboard } = state;
  const totalAssets = team.cash + team.cv;

  // Read persisted match state (synchronized across Admin and Team Phone)
  const matchState = loadMatchState(room.started_at || 'active_room', []);
  const position =
    matchState.positions[`slot-${team.slot}`] ??
    matchState.positions[String(team.slot)] ??
    0;
  const space = getBoardSpace(position);

  const isMyTurn = matchState.activeTeamSlot === team.slot;
  const isSkipped = Boolean(matchState.skippedTurns[`slot-${team.slot}`]);

  const cashFlashClass =
    cashFlash === 'up'
      ? 'bg-[#DCFCE7] border-[#22C55E] ring-4 ring-[#22C55E] transition-colors duration-300'
      : cashFlash === 'down'
      ? 'bg-[#FEF2F2] border-[#EF4444] ring-4 ring-[#EF4444] transition-colors duration-300'
      : 'bg-white border-[#102040]';

  const cvFlashClass =
    cvFlash === 'up'
      ? 'bg-[#EFF6FF] border-[#3B82F6] ring-4 ring-[#3B82F6] transition-colors duration-300'
      : cvFlash === 'down'
      ? 'bg-[#FEF2F2] border-[#EF4444] ring-4 ring-[#EF4444] transition-colors duration-300'
      : 'bg-white border-[#102040]';

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Turn / Game Status Banner */}
      {team.is_bankrupt ? (
        <div className="bg-[#D32F2F] text-white border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3.5 text-center">
          <span className="font-pixel text-sm sm:text-base tracking-wider block">
            ☠ ELIMINATED • TEAM IS BANKRUPT ☠
          </span>
          <span className="font-mono text-xs opacity-90 block mt-0.5">
            Unable to settle board obligations. Financial assets frozen.
          </span>
        </div>
      ) : room.status === 'PAUSED' ? (
        <div className="bg-[#FEF3C7] text-[#B45309] border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 text-center">
          <span className="font-pixel text-xs sm:text-sm tracking-wider block">
            ⏸ MATCH PAUSED BY ORGANIZER
          </span>
          <span className="font-mono text-xs text-[#92400E] block mt-0.5">
            Game timer and board operations are temporarily frozen.
          </span>
        </div>
      ) : room.status === 'TIME_EXPIRED' ? (
        <div className="bg-[#FFCC00] text-[#102040] border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 text-center">
          <span className="font-pixel text-xs sm:text-sm tracking-wider block">
            🏁 50:00 TIMER REACHED • SCORES FROZEN
          </span>
          <span className="font-mono text-xs text-[#102040] block mt-0.5 font-bold">
            Highest Company Value wins. Tie-breakers: Cash → Businesses → Pitch.
          </span>
        </div>
      ) : isSkipped ? (
        <div className="bg-[#B45309] text-white border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 text-center">
          <span className="font-pixel text-xs sm:text-sm tracking-wide block">
            ⚠ NEXT TURN SKIPPED (PITCH PENALTY)
          </span>
          <span className="font-mono text-xs opacity-90 block mt-0.5">
            Waiting for next cycle after skipped turn.
          </span>
        </div>
      ) : isMyTurn ? (
        <div className="bg-[#22C55E] text-[#0A101D] border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 text-center animate-pulse">
          <span className="font-pixel text-sm sm:text-base tracking-wider block font-bold">
            🎲 YOUR TURN TO ROLL!
          </span>
          <span className="font-mono text-xs font-semibold block mt-0.5">
            Step up to the physical board to roll the die with the Game Master.
          </span>
        </div>
      ) : (
        <div className="bg-[#102040] text-white border-4 border-[#38BDF8] shadow-[4px_4px_0px_#102040] p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 bg-[#38BDF8] anim-pulse-dot" />
            <span className="font-pixel text-xs sm:text-sm text-[#FFCC00] tracking-wide">
              WAITING FOR TURN
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#94A3B8]">
            Round-robin gameplay in progress. Track live updates below.
          </span>
        </div>
      )}

      {/* 2. Current Board Position Card */}
      <div className="bg-[#102040] text-white border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 sm:p-4 flex items-center justify-between">
        <div>
          <span className="font-pixel text-[10px] text-[#94A3B8] uppercase block">
            PHYSICAL BOARD LOCATION
          </span>
          <span className="font-pixel text-sm text-[#FFCC00] block mt-0.5">
            SPACE #{position} OF 24: {space.name}
          </span>
          <span className="font-mono text-[11px] text-[#CBD5E1] block mt-0.5">
            {space.description}
          </span>
        </div>
        <div className="bg-[#162544] border-2 border-[#FFCC00] px-3 py-2 text-center flex-shrink-0">
          <span className="font-pixel text-[9px] text-[#94A3B8] block">SPACE</span>
          <span className="font-pixel text-base text-[#FFCC00]">#{position}</span>
        </div>
      </div>

      {/* 3. Authoritative Server Countdown Clock Card */}
      <div className="text-center">
        <div className="bg-[#102040] text-white border-4 border-[#102040] shadow-[4px_4px_0px_#102040] p-3 sm:p-4">
          <Countdown
            endsAt={room.ends_at}
            status={room.status}
            serverNow={room.server_now}
            durationSeconds={room.duration_seconds}
            onExpire={onExpire}
            size="lg"
            showLabel={false}
          />
          <span className="font-pixel text-[10px] text-[#FFCC00] uppercase tracking-widest block mt-1">
            {room.status === 'PAUSED' ? 'MATCH PAUSED' : 'GAME TIME LEFT'}
          </span>
        </div>
      </div>

      {/* 4. Financial Metrics: Cash & CV */}
      <div className="flex flex-col gap-3">
        {/* Cash Card */}
        <div
          className={`
            border-4 shadow-[4px_4px_0px_#102040] p-4 flex flex-col justify-between relative
            ${cashFlashClass}
          `}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[11px] uppercase tracking-wider text-[#102040] font-bold">
              AVAILABLE CASH
            </span>
            <div className="flex items-center gap-1.5">
              {cashFlash === 'up' && (
                <span className="bg-[#22B14C] text-white font-pixel text-[9px] px-1.5 py-0.5 border border-[#102040]">
                  ▲ +
                </span>
              )}
              {cashFlash === 'down' && (
                <span className="bg-[#D32F2F] text-white font-pixel text-[9px] px-1.5 py-0.5 border border-[#102040]">
                  ▼ -
                </span>
              )}
              <PixelCoin size={24} />
            </div>
          </div>
          <div className="font-tabular font-black text-[44px] leading-tight sm:text-5xl text-[#22B14C] tracking-tight tabular-nums">
            {formatINR(team.cash)}
          </div>
        </div>

        {/* Company Value Card */}
        <div
          className={`
            border-4 shadow-[4px_4px_0px_#102040] p-4 flex flex-col justify-between relative
            ${cvFlashClass}
          `}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[11px] uppercase tracking-wider text-[#102040] font-bold">
              COMPANY VALUE (WINNING METRIC)
            </span>
            <div className="flex items-center gap-1.5">
              {cvFlash === 'up' && (
                <span className="bg-[#1E40AF] text-white font-pixel text-[9px] px-1.5 py-0.5 border border-[#102040]">
                  ▲ +
                </span>
              )}
              {cvFlash === 'down' && (
                <span className="bg-[#D32F2F] text-white font-pixel text-[9px] px-1.5 py-0.5 border border-[#102040]">
                  ▼ -
                </span>
              )}
              <span className="font-pixel text-[10px] bg-[#102040] text-[#FFCC00] px-2 py-0.5 border border-[#102040]">
                CV
              </span>
            </div>
          </div>
          <div className="font-tabular font-black text-[44px] leading-tight sm:text-5xl text-[#1E40AF] tracking-tight tabular-nums">
            {team.cv.toLocaleString()} <span className="text-2xl sm:text-3xl text-[#334155]">CV</span>
          </div>
        </div>

        {/* Total Assets Summary Banner */}
        <div className="bg-[#FFCC00] border-4 border-[#102040] p-3 shadow-[4px_4px_0px_#102040] flex items-center justify-between">
          <span className="font-pixel text-xs text-[#102040] uppercase font-bold">
            TOTAL VALUATION (CASH + CV):
          </span>
          <span className="font-tabular font-black text-2xl text-[#102040] tabular-nums">
            {formatINR(totalAssets)}
          </span>
        </div>
      </div>

      {/* 5. Owned Businesses List */}
      <PixelCard
        title={`PORTFOLIO (${businesses.length}/3 MAX)`}
        headerBg="navy"
        padding="sm"
      >
        {businesses.length === 0 ? (
          <EmptyState
            title="NO BUSINESSES YET"
            description="Acquire unowned businesses when landing on them around the 24-space physical board."
            className="border-none bg-transparent p-4"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {businesses.map((biz) => (
              <div
                key={biz.business_key}
                className="border-3 border-[#102040] bg-white p-3 shadow-[2px_2px_0px_#102040] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b-2 border-[#E2E8F0] pb-2">
                  <div className="flex items-center gap-2">
                    <PixelBusinessIcon businessKey={biz.business_key} size={24} />
                    <h4 className="font-pixel text-xs text-[#102040] truncate font-bold">
                      {biz.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-[10px] text-[#334155] font-bold">
                      LVL {biz.level}
                    </span>
                    <PixelLevelPips level={biz.level} />
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-[#334155]">
                  <span>Initial Cost: ₹{biz.cost}</span>
                  <span className="font-bold text-[#1E40AF]">
                    CV contribution: ₹{biz.cv_contribution}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PixelCard>

      {/* 6. Compact Live Standings / Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <PixelCard title="LIVE STANDINGS" headerBg="navy" padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#102040] text-[10px] font-pixel text-[#102040]">
                  <th className="py-1">#</th>
                  <th className="py-1">TEAM</th>
                  <th className="py-1 text-right">CV (SCORE)</th>
                  <th className="py-1 text-right">CASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {leaderboard.map((item) => (
                  <tr key={item.name} className="py-1">
                    <td className="py-1 font-pixel text-[10px]">#{item.rank}</td>
                    <td className="py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 border border-[#102040]" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-[#102040]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-1 text-right font-bold text-[#1E40AF]">
                      {item.cv.toLocaleString()} CV
                    </td>
                    <td className="py-1 text-right font-bold text-[#22C55E]">
                      {formatINR(item.cash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PixelCard>
      )}
    </div>
  );
};
