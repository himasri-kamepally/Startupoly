import React from 'react';
import { PixelLevelPips, PixelCoin } from '../../../ui/pixel';
import { AdminRoomSnapshot } from '../../../data/rpc';

export interface TeamCardProps {
  team: AdminRoomSnapshot['teams'][0];
  isSelected: boolean;
  onClick: () => void;
  flash?: 'up' | 'down' | null;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isSelected,
  onClick,
  flash,
}) => {
  const flashBg =
    flash === 'up'
      ? 'bg-[#E8F8EE] ring-4 ring-[#22B14C]'
      : flash === 'down'
      ? 'bg-[#FEECEB] ring-4 ring-[#D32F2F]'
      : '';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Select team ${team.slot}: ${team.name}`}
      className={`
        relative text-left w-full transition-all duration-150 cursor-pointer select-none
        border-4 overflow-hidden flex flex-col justify-between
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFCC00] focus-visible:ring-offset-2
        ${flashBg}
        ${
          isSelected
            ? 'border-[#FFCC00] bg-[#FFFBEB] shadow-[0_0_0_3px_#102040,5px_5px_0px_#102040] ring-4 ring-[#102040] scale-[1.015] z-10'
            : 'border-[#102040] bg-[#FAF8F5] hover:bg-[#F1F5F9] shadow-[2px_2px_0px_#102040]'
        }
        ${team.is_bankrupt ? 'bg-[#FEECEB]/60 opacity-80' : ''}
      `}
    >
      {/* Top Team Color Stripe & Flash feedback */}
      <div
        className="h-3 w-full border-b-2 border-[#102040] relative flex items-center justify-between px-2"
        style={{ backgroundColor: team.color }}
      >
        <span className="font-pixel text-[8px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] uppercase">
          SLOT #{team.slot}
        </span>
        <div className="flex items-center gap-1">
          {flash === 'up' && (
            <span className="bg-[#22B14C] text-white font-pixel text-[8px] px-1 border border-[#102040]">
              ▲ +
            </span>
          )}
          {flash === 'down' && (
            <span className="bg-[#D32F2F] text-white font-pixel text-[8px] px-1 border border-[#102040]">
              ▼ -
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5 sm:p-3 flex flex-col gap-2.5">
        {/* Header row: team name, selection ribbon, and status badge */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-3.5 h-3.5 border border-[#102040] flex-shrink-0 shadow-[1px_1px_0px_#102040]"
              style={{ backgroundColor: team.color }}
              aria-hidden="true"
            />
            <span className="font-pixel text-xs text-[#102040] truncate font-bold" title={team.name}>
              {team.name}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isSelected && (
              <span className="font-pixel text-[9px] bg-[#FFCC00] text-[#102040] px-1.5 py-0.5 border border-[#102040] font-black shadow-[1px_1px_0px_#102040]">
                ▶ SELECTED
              </span>
            )}
            {team.is_bankrupt ? (
              <span
                className="font-pixel text-[9px] bg-[#FEECEB] text-[#D32F2F] px-1.5 py-0.5 border border-[#D32F2F] font-bold inline-flex items-center gap-0.5 shadow-[1px_1px_0px_#D32F2F]"
                title="Team bankrupt — gameplay locked"
              >
                <span>✕</span> ELIMINATED
              </span>
            ) : (
              <span
                className="font-pixel text-[9px] bg-[#E8F8EE] text-[#166534] px-1.5 py-0.5 border border-[#22B14C] font-bold inline-flex items-center gap-1 shadow-[1px_1px_0px_#22B14C]"
                title={team.claimed ? 'Team phone connected and active' : 'Waiting for team phone to connect'}
              >
                <span>✓</span>
                <span>ACTIVE</span>
                <span
                  className={`w-2 h-2 rounded-full border border-[#102040] inline-block ${
                    team.claimed ? 'bg-[#22B14C] animate-pulse' : 'bg-[#94A3B8]'
                  }`}
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
        </div>

        {/* Metrics row: Cash & Company Value (CV) (≥ 32px numbers) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 bg-white p-2.5 border-2 border-[#102040] shadow-[1px_1px_0px_#102040]">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-pixel text-[9px] text-[#102040] block uppercase tracking-wider font-bold">
                CASH
              </span>
              <PixelCoin size={14} />
            </div>
            <span className="font-tabular text-[28px] sm:text-[32px] leading-tight font-black text-[#22B14C] block truncate tabular-nums">
              ₹{team.cash.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-pixel text-[9px] text-[#102040] block uppercase tracking-wider font-bold">
                COMPANY VALUE (CV)
              </span>
              <span className="font-pixel text-[8px] bg-[#102040] text-[#FFCC00] px-1 py-0.2">
                CV
              </span>
            </div>
            <span className="font-tabular text-[28px] sm:text-[32px] leading-tight font-black text-[#1E40AF] block truncate tabular-nums">
              ₹{team.cv.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Businesses status row: spelled-out "Businesses owned: X/3" and level indicators */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-pixel text-[9px] text-[#102040] font-bold">
              BUSINESSES OWNED ({team.businesses.length}/3):
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {team.businesses.map((biz) => (
                <div
                  key={biz.business_key}
                  title={`${biz.name} (Upgrade Level ${biz.level})`}
                  className="flex items-center bg-[#FAF8F5] px-1 py-0.5 border border-[#102040] shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                >
                  <span className="font-mono text-[9px] font-bold text-[#102040] mr-1">
                    {biz.name.slice(0, 3).toUpperCase()}
                  </span>
                  <PixelLevelPips level={biz.level as 0 | 1 | 2} size="sm" />
                </div>
              ))}
              {team.businesses.length === 0 && (
                <span className="font-mono text-[10px] text-[#64748B] italic">None owned</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
