import React from 'react';
import { StandingsRow, AdminRoomSnapshot } from '../../../data/rpc';

export interface StandingsTableProps {
  standings: StandingsRow[];
  teams?: AdminRoomSnapshot['teams'];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  teams = [],
}) => {
  const teamColorMap = new Map(teams.map((t) => [t.id, t.color]));

  return (
    <div className="border-3 border-[#102040] shadow-[3px_3px_0px_#102040] overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse font-mono text-xs" aria-label="Tournament standings and metrics table">
        <thead>
          <tr className="bg-[#102040] text-white font-pixel text-[9px] uppercase border-b-2 border-[#102040]">
            <th scope="col" className="p-2.5 text-center w-14">RANK</th>
            <th scope="col" className="p-2.5">TEAM</th>
            <th scope="col" className="p-2.5 text-right whitespace-nowrap">COMPANY VALUE (CV)</th>
            <th scope="col" className="p-2.5 text-right whitespace-nowrap">CASH (₹)</th>
            <th scope="col" className="p-2.5 text-center whitespace-nowrap">BUSINESSES OWNED</th>
            <th scope="col" className="p-2.5 text-center whitespace-nowrap">MATCH STATUS</th>
            <th scope="col" className="p-2.5 text-center whitespace-nowrap">TIE STATUS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#CBD5E1]">
          {standings.map((row) => {
            const color = teamColorMap.get(row.team_id) || '#64748B';

            return (
              <tr
                key={row.team_id}
                className={`
                  hover:bg-[#FAF8F5] transition-colors
                  ${row.tie_unresolved ? 'bg-[#FFFBEB]' : ''}
                  ${row.is_bankrupt ? 'bg-[#FEECEB]/60' : ''}
                `}
              >
                {/* Rank */}
                <td className="p-2.5 text-center font-pixel text-xs font-bold text-[#102040]">
                  {row.rank === 1 ? '🥇 1st' : row.rank === 2 ? '🥈 2nd' : row.rank === 3 ? '🥉 3rd' : `#${row.rank}`}
                </td>

                {/* Team */}
                <td className="p-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 border-2 border-[#102040] flex-shrink-0 shadow-[1px_1px_0px_#102040]"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className={`font-sans font-bold text-xs text-[#102040] truncate ${row.is_bankrupt ? 'line-through text-[#64748B]' : ''}`}>
                      {row.name}
                    </span>
                  </div>
                </td>

                {/* Company Value (CV) */}
                <td className="p-2.5 text-right font-tabular font-bold text-[#1E40AF]">
                  ₹{row.cv.toLocaleString('en-IN')}
                </td>

                {/* Cash */}
                <td className="p-2.5 text-right font-tabular font-bold text-[#22B14C]">
                  ₹{row.cash.toLocaleString('en-IN')}
                </td>

                {/* Businesses Owned */}
                <td className="p-2.5 text-center font-mono font-medium">
                  <span className="bg-[#FAF8F5] border border-[#CBD5E1] px-2 py-0.5 shadow-[1px_1px_0px_rgba(0,0,0,0.05)]">
                    {row.business_count} / 3 owned
                  </span>
                </td>

                {/* Status: Accessible with clear distinct symbols and text */}
                <td className="p-2.5 text-center">
                  {row.is_bankrupt ? (
                    <span
                      className="font-pixel text-[9px] bg-[#FEECEB] text-[#D32F2F] border-2 border-[#D32F2F] px-2 py-0.5 uppercase inline-flex items-center gap-1 font-bold shadow-[1px_1px_0px_#D32F2F]"
                      title="Team cannot pay debts and has been eliminated"
                    >
                      <span aria-hidden="true">✕</span> ELIMINATED (BANKRUPT)
                    </span>
                  ) : (
                    <span
                      className="font-pixel text-[9px] bg-[#E8F8EE] text-[#166534] border-2 border-[#22B14C] px-2 py-0.5 uppercase inline-flex items-center gap-1 font-bold shadow-[1px_1px_0px_#22B14C]"
                      title="Team is actively competing"
                    >
                      <span aria-hidden="true">✓</span> ACTIVE
                    </span>
                  )}
                </td>

                {/* Tie Status */}
                <td className="p-2.5 text-center">
                  {row.tie_unresolved ? (
                    <span
                      className="font-pixel text-[9px] bg-[#FEF3C7] text-[#B45309] border-2 border-[#B45309] px-2 py-0.5 animate-pulse inline-flex items-center gap-1 font-bold shadow-[1px_1px_0px_#B45309]"
                      title="Tied on CV, cash, and business count. 30s pitch required by Game Master."
                    >
                      ⚠ UNRESOLVED TIE
                    </span>
                  ) : row.tiebreak_order ? (
                    <span className="font-pixel text-[9px] bg-[#E0E7FF] text-[#3730A3] border-2 border-[#3730A3] px-2 py-0.5 font-bold">
                      ⚖ Pitch Order #{row.tiebreak_order}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-[#94A3B8]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
