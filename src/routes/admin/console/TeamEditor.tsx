import React from 'react';
import { ValueEditor } from './ValueEditor';
import { BusinessList } from './BusinessList';
import { PixelButton } from '../../../ui';
import { AdminRoomSnapshot } from '../../../data/rpc';

export interface TeamEditorProps {
  team: AdminRoomSnapshot['teams'][0];
  isTimeExpired: boolean;
  disabled?: boolean;
  onUpdateCash: (newCash: number, note?: string) => Promise<void>;
  onUpdateCv: (newCv: number, note?: string) => Promise<void>;
  onAddBusinessClick: () => void;
  onUpgradeBusinessClick: (bizKey: string) => void;
  onEditBusinessClick: (bizKey: string) => void;
  onRemoveBusinessClick: (bizKey: string) => void;
  onOpenBankruptModal: (mode: 'declare' | 'undo') => void;
}

export const TeamEditor: React.FC<TeamEditorProps> = ({
  team,
  isTimeExpired,
  disabled = false,
  onUpdateCash,
  onUpdateCv,
  onAddBusinessClick,
  onUpgradeBusinessClick,
  onEditBusinessClick,
  onRemoveBusinessClick,
  onOpenBankruptModal,
}) => {
  return (
    <div className="bg-[#FAF8F5] border-4 border-[#102040] shadow-[4px_4px_0px_#102040] flex flex-col overflow-hidden">
      {/* 1. Selected Team Header Banner */}
      <div
        className="p-3 border-b-4 border-[#102040] flex flex-wrap items-center justify-between gap-2.5"
        style={{
          backgroundColor: '#102040',
          color: '#FFFFFF',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-4 h-4 border-2 border-white flex-shrink-0 shadow-[1px_1px_0px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: team.color }}
            aria-hidden="true"
          />
          <h2 className="font-pixel text-xs sm:text-sm uppercase tracking-wider truncate">
            SLOT #{team.slot}: {team.name}
          </h2>
          <span className="font-pixel text-[9px] bg-[#FFCC00] text-[#102040] px-1.5 py-0.5 border border-[#102040] font-black">
            ACTIVE TARGET
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-[#1E293B] text-[#94A3B8] px-2 py-0.5 border border-white/20 font-bold" title="Optimistic concurrency control version">
            v{team.version}
          </span>
          {team.is_bankrupt ? (
            <span className="bg-[#D32F2F] text-white font-pixel text-[10px] px-2 py-0.5 border-2 border-white font-bold inline-flex items-center gap-1">
              <span>✕</span> ELIMINATED (BANKRUPT)
            </span>
          ) : (
            <span className="bg-[#22B14C] text-white font-pixel text-[10px] px-2 py-0.5 border border-white font-bold inline-flex items-center gap-1">
              <span>✓</span> ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* 2. Selected Team Summary Strip */}
      <div className="bg-white border-b-2 border-[#102040] p-2.5 px-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="border-r border-[#CBD5E1] pr-2">
          <span className="font-pixel text-[8px] text-[#64748B] block uppercase">CASH BALANCE</span>
          <strong className="text-[#22B14C] text-sm font-black">₹{team.cash.toLocaleString('en-IN')}</strong>
        </div>
        <div className="border-r border-[#CBD5E1] pr-2">
          <span className="font-pixel text-[8px] text-[#64748B] block uppercase">COMPANY VALUE (CV)</span>
          <strong className="text-[#1E40AF] text-sm font-black">₹{team.cv.toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <span className="font-pixel text-[8px] text-[#64748B] block uppercase">BUSINESSES HELD</span>
          <strong className="text-[#102040] text-sm font-black">{team.businesses.length} / 3 max</strong>
        </div>
      </div>

      {/* 3. Editor Body */}
      <div className="p-3 sm:p-4 flex flex-col gap-5">
        {/* Bankrupt Banner if applicable */}
        {team.is_bankrupt && (
          <div className="bg-[#FEECEB] border-3 border-[#D32F2F] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[2px_2px_0px_#D32F2F]">
            <div className="flex items-start gap-2.5">
              <span className="text-xl" aria-hidden="true">🔒</span>
              <div>
                <span className="font-pixel text-xs text-[#D32F2F] block font-bold">
                  TEAM IS ELIMINATED (BANKRUPT) — GAMEPLAY EDITS LOCKED
                </span>
                <p className="font-mono text-xs text-[#64748B] mt-0.5">
                  All owned businesses were surrendered to the bank. Ordinary gameplay operations are locked.
                  Only the Game Master can undo this via an Admin Correction.
                </p>
              </div>
            </div>

            <PixelButton
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onOpenBankruptModal('undo')}
              className="flex-shrink-0"
            >
              UNDO BANKRUPTCY (CORRECTION)
            </PixelButton>
          </div>
        )}

        {/* --- GROUP A: ORDINARY GAMEPLAY OPERATIONS (Businesses & Upgrades) --- */}
        <section aria-labelledby="gameplay-ops-title" className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b-2 border-[#102040] pb-1">
            <h3 id="gameplay-ops-title" className="font-pixel text-xs uppercase text-[#102040] font-bold flex items-center gap-1.5">
              <span>🏢</span> ORDINARY GAMEPLAY OPERATIONS (PORTFOLIO)
            </h3>
            <span className="font-mono text-[10px] text-[#64748B]">
              Max 3 businesses per team
            </span>
          </div>

          {team.is_bankrupt ? (
            <div className="bg-[#FAF8F5] border-2 border-dashed border-[#CBD5E1] p-4 text-center">
              <p className="font-mono text-xs text-[#64748B]">
                Ordinary business acquisitions and upgrades are locked because this team is eliminated.
              </p>
            </div>
          ) : (
            <BusinessList
              team={team}
              onAddClick={onAddBusinessClick}
              onUpgradeClick={onUpgradeBusinessClick}
              onEditClick={onEditBusinessClick}
              onRemoveClick={onRemoveBusinessClick}
              disabled={disabled || team.is_bankrupt}
            />
          )}
        </section>

        {/* --- GROUP B: ADMIN CORRECTIONS & AUDIT OVERRIDES --- */}
        <section
          aria-labelledby="admin-corrections-title"
          className="bg-[#FFFBEB] border-3 border-[#B45309] p-3.5 shadow-[3px_3px_0px_#B45309] flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#B45309]/30 pb-2">
            <div>
              <h3 id="admin-corrections-title" className="font-pixel text-xs uppercase text-[#92400E] font-bold flex items-center gap-1.5">
                <span>⚙</span> ADMIN CORRECTIONS (AUDIT TRAIL)
              </h3>
              <p className="font-mono text-[11px] text-[#92400E]/80 mt-0.5">
                Direct manual balance corrections. Requires a mandatory audit reason note during post-match (scores frozen) or manual level changes.
              </p>
            </div>
            <span className="font-pixel text-[8px] bg-[#B45309] text-white px-2 py-0.5 uppercase self-start sm:self-auto">
              ORGANIZER OVERRIDE
            </span>
          </div>

          {/* Cash & Company Value (CV) Manual Correction Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ValueEditor
              label="Cash Balance (Admin Correction)"
              currentValue={team.cash}
              onUpdate={onUpdateCash}
              isTimeExpired={isTimeExpired}
              disabled={disabled || team.is_bankrupt}
            />
            <ValueEditor
              label="Company Value (CV) (Admin Correction)"
              currentValue={team.cv}
              onUpdate={onUpdateCv}
              isTimeExpired={isTimeExpired}
              disabled={disabled || team.is_bankrupt}
            />
          </div>

          {/* Bankruptcy Action Bar in Admin Corrections */}
          <div className="pt-2 border-t border-[#B45309]/30 flex flex-wrap items-center justify-between gap-2">
            {team.is_bankrupt ? (
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs text-[#92400E]">
                  To restore this team to active competition standing:
                </span>
                <PixelButton
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onOpenBankruptModal('undo')}
                >
                  UNDO BANKRUPTCY (CORRECTION)
                </PixelButton>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs text-[#64748B]">
                  Physical debt insolvency (team cannot pay after forced sales):
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onOpenBankruptModal('declare')}
                  className="
                    font-pixel text-xs uppercase px-3 py-2 bg-[#D32F2F] text-white
                    border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#B71C1C]
                    active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]
                  "
                >
                  MARK BANKRUPT
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
