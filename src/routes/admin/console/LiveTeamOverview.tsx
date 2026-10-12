import React from 'react';
import { AdminRoomSnapshot } from '../../../data/rpc';
import { getBoardSpace } from '../../../domain/board';
import { loadMatchState } from '../../../domain/matchState';
import { PixelBusinessIcon } from '../../../ui/pixel';
import { formatINR } from '../../../lib/format';
import { PixelCard } from '../../../ui';

export interface LiveTeamOverviewProps {
  snapshot: AdminRoomSnapshot;
  selectedTeamId: string;
  onSelectTeam: (id: string) => void;
  flashes?: Record<string, 'up' | 'down' | null>;
}

export const LiveTeamOverview: React.FC<LiveTeamOverviewProps> = ({
  snapshot,
  selectedTeamId,
  onSelectTeam,
  flashes = {},
}) => {
  const matchState = loadMatchState(snapshot.room.id, snapshot.teams);

  if (snapshot.teams.length === 0) {
    return (
      <PixelCard title="4. LIVE TEAM OVERVIEW" headerBg="navy">
        <div className="p-8 text-center bg-[#102040] text-[#94A3B8]">
          <span className="font-pixel text-xs text-[#FFCC00] block mb-1">
            NO TEAMS REGISTERED YET
          </span>
          <p className="font-mono text-xs">
            Teams will appear here once configured in the tournament room.
          </p>
        </div>
      </PixelCard>
    );
  }

  // Calculate live ranks (Highest CV, then highest cash, then most businesses)
  const rankedTeams = [...snapshot.teams].sort((a, b) => {
    if (a.is_bankrupt && !b.is_bankrupt) return 1;
    if (!a.is_bankrupt && b.is_bankrupt) return -1;
    if (b.cv !== a.cv) return b.cv - a.cv;
    if (b.cash !== a.cash) return b.cash - a.cash;
    return b.businesses.length - a.businesses.length;
  });

  const getRank = (teamId: string) => {
    const idx = rankedTeams.findIndex((t) => t.id === teamId);
    return idx >= 0 ? idx + 1 : '-';
  };

  return (
    <PixelCard
      title={`4. LIVE TEAM OVERVIEW (${snapshot.teams.length} TEAMS)`}
      headerBg="navy"
      headerRight={
        <span className="font-mono text-[10px] text-[#94A3B8]">
          CLICK ROW TO INSPECT & EDIT
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs text-left">
          <thead>
            <tr className="bg-[#102040] text-[#00F0FF] border-b-2 border-[#1E294B] font-pixel text-[10px] uppercase">
              <th className="py-2.5 px-3 text-center">RANK</th>
              <th className="py-2.5 px-3">TEAM</th>
              <th className="py-2.5 px-3 text-right">CASH</th>
              <th className="py-2.5 px-3 text-right">CV</th>
              <th className="py-2.5 px-3 text-right">VALUATION</th>
              <th className="py-2.5 px-3">PORTFOLIO (MAX 3)</th>
              <th className="py-2.5 px-3">POSITION</th>
              <th className="py-2.5 px-3 text-center">TURN STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E294B] text-white">
            {snapshot.teams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              const isUpNow = team.id === matchState.activeTeamId;
              const position = matchState.positions[team.id] ?? 0;
              const space = getBoardSpace(position);
              const rank = getRank(team.id);
              const totalValuation = team.cash + team.cv;
              const flash = flashes[team.id];

              return (
                <tr
                  key={team.id}
                  onClick={() => onSelectTeam(team.id)}
                  className={`
                    cursor-pointer transition-colors
                    ${
                      isSelected
                        ? 'bg-[#1E3A8A]/50 border-l-4 border-l-[#FFCC00]'
                        : isUpNow
                        ? 'bg-[#132240] hover:bg-[#1E294B]'
                        : 'hover:bg-[#162544]'
                    }
                    ${team.is_bankrupt ? 'opacity-60 bg-[#1F1622]' : ''}
                    ${
                      flash === 'up'
                        ? 'bg-[#064E3B]'
                        : flash === 'down'
                        ? 'bg-[#7F1D1D]'
                        : ''
                    }
                  `}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-pixel text-xs">
                    {team.is_bankrupt ? (
                      <span className="text-[#EF4444]">☠</span>
                    ) : (
                      <span className={rank === 1 ? 'text-[#FFCC00] font-bold' : 'text-[#94A3B8]'}>
                        #{rank}
                      </span>
                    )}
                  </td>

                  {/* Team Name and Color */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 border border-white flex-shrink-0"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-pixel text-xs text-white">
                        {team.name}
                      </span>
                    </div>
                  </td>

                  {/* Cash */}
                  <td className="py-3 px-3 text-right font-tabular text-[#22C55E] font-bold text-sm">
                    {formatINR(team.cash)}
                  </td>

                  {/* CV */}
                  <td className="py-3 px-3 text-right font-tabular text-[#38BDF8] font-bold text-sm">
                    {team.cv.toLocaleString()} CV
                  </td>

                  {/* Total Valuation */}
                  <td className="py-3 px-3 text-right font-tabular text-[#FFCC00] font-bold">
                    {formatINR(totalValuation)}
                  </td>

                  {/* Portfolio */}
                  <td className="py-3 px-3">
                    {team.businesses.length === 0 ? (
                      <span className="text-[#64748B] text-[11px] italic">0 / 3</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {team.businesses.map((biz) => (
                          <div
                            key={biz.business_key}
                            className="bg-[#102040] border border-[#334155] px-1.5 py-0.5 flex items-center gap-1"
                            title={`${biz.name} (Level ${biz.level})`}
                          >
                            <PixelBusinessIcon businessKey={biz.business_key} size={14} />
                            <span className="text-[10px] text-white uppercase">{biz.name.slice(0, 4)}</span>
                            <span className="text-[9px] text-[#FFCC00] font-bold">L{biz.level}</span>
                          </div>
                        ))}
                        <span className="text-[#94A3B8] text-[10px]">({team.businesses.length}/3)</span>
                      </div>
                    )}
                  </td>

                  {/* Board Position */}
                  <td className="py-3 px-3 text-xs">
                    <span className="text-[#FFCC00] font-pixel text-[10px] block">
                      #{position} {space.name}
                    </span>
                  </td>

                  {/* Turn Status */}
                  <td className="py-3 px-3 text-center">
                    {team.is_bankrupt ? (
                      <span className="bg-[#EF4444] text-white font-pixel text-[9px] px-2 py-0.5">
                        BANKRUPT
                      </span>
                    ) : isUpNow ? (
                      <span className="bg-[#22C55E] text-[#0A101D] font-pixel text-[9px] px-2 py-0.5 font-bold anim-pulse-dot">
                        UP NOW
                      </span>
                    ) : matchState.skippedTurns[team.id] ? (
                      <span className="bg-[#F59E0B] text-[#0A101D] font-pixel text-[9px] px-2 py-0.5">
                        SKIPPED
                      </span>
                    ) : (
                      <span className="bg-[#1E294B] text-[#94A3B8] font-pixel text-[9px] px-2 py-0.5">
                        WAITING
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PixelCard>
  );
};
