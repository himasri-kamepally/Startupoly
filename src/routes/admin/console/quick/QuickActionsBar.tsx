import React from 'react';

export interface QuickActionsBarProps {
  onOpenRent: () => void;
  onOpenStartLap: () => void;
  onOpenBuy: () => void;
  onOpenUpgrade: () => void;
  onOpenForcedSale: () => void;
  onOpenSteal: () => void;
  onOpenBonusCard: () => void;
  onOpenCrisisCard: () => void;
  onOpenLoseFeature: () => void;
  disabled?: boolean;
}

export interface QuickActionsBarProps {
  onOpenRent: () => void;
  onOpenStartLap: () => void;
  onOpenBuy: () => void;
  onOpenUpgrade: () => void;
  onOpenForcedSale: () => void;
  onOpenSteal: () => void;
  onOpenBonusCard: () => void;
  onOpenCrisisCard: () => void;
  onOpenLoseFeature: () => void;
  disabled?: boolean;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenRent,
  onOpenStartLap,
  onOpenBuy,
  onOpenUpgrade,
  onOpenForcedSale,
  onOpenSteal,
  onOpenBonusCard,
  onOpenCrisisCard,
  onOpenLoseFeature,
  disabled = false,
}) => {
  return (
    <div className="bg-[#102040] border-4 border-[#102040] p-3 sm:p-4 shadow-[4px_4px_0px_#102040] flex flex-col gap-3.5">
      {/* Header and Hotkey Guide */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-white/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-[#FFCC00] uppercase tracking-wider font-bold">
            ⚡ QUICK ACTIONS (CALCULATOR)
          </span>
          <span className="font-mono text-[11px] text-[#94A3B8]">
            Pre-calculates rent, startup capital, and cards
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#FFCC00] bg-[#1E293B] px-2 py-0.5 border border-white/20">
          <span>Keyboard Hotkeys:</span>
          <kbd className="bg-black/40 px-1 py-0.2 border border-white/30 text-white font-pixel">R</kbd> Rent
          <span className="text-white/40">•</span>
          <kbd className="bg-black/40 px-1 py-0.2 border border-white/30 text-white font-pixel">S</kbd> Start
          <span className="text-white/40">•</span>
          <kbd className="bg-black/40 px-1 py-0.2 border border-white/30 text-white font-pixel">B</kbd> Buy
          <span className="text-white/40">•</span>
          <kbd className="bg-black/40 px-1 py-0.2 border border-white/30 text-white font-pixel">U</kbd> Upgrade
        </div>
      </div>

      {/* Grid of 2 Main Functional Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* GROUP 1: Business and Money (Rent, Start Lap, Buy, Upgrade, Forced Sale, Steal Talent) */}
        <div className="lg:col-span-8 bg-[#162952] border-2 border-white/20 p-2.5 sm:p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-[#FFCC00] uppercase font-bold tracking-wider">
              1. BUSINESS & MONEY TRANSACTIONS
            </span>
            <span className="font-mono text-[10px] text-[#94A3B8]">
              Board movements & purchases
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Rent */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenRent}
              className="
                flex flex-col items-start p-2 bg-[#FFCC00] text-[#102040] text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#FFE066]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">RENT (R)</span>
                <span className="font-pixel text-[8px] bg-[#102040] text-[#FFCC00] px-1 py-0.2 border border-[#102040]">
                  R
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#102040]/80 leading-tight">
                Tenant pays business owner
              </span>
            </button>

            {/* Start Lap */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenStartLap}
              className="
                flex flex-col items-start p-2 bg-[#22B14C] text-white text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#1C8D3D]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">START LAP (S)</span>
                <span className="font-pixel text-[8px] bg-black/40 text-white px-1 py-0.2 border border-white/30">
                  S
                </span>
              </div>
              <span className="font-mono text-[10px] text-white/90 leading-tight">
                Collect ₹200 passing (₹400 landing)
              </span>
            </button>

            {/* Buy Business */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenBuy}
              className="
                flex flex-col items-start p-2 bg-[#FAF8F5] text-[#102040] text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-white
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">BUY (B)</span>
                <span className="font-pixel text-[8px] bg-[#102040] text-white px-1 py-0.2 border border-[#102040]">
                  B
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#64748B] leading-tight">
                Acquire unowned catalog business
              </span>
            </button>

            {/* Upgrade */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenUpgrade}
              className="
                flex flex-col items-start p-2 bg-[#FAF8F5] text-[#102040] text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-white
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00]
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">UPGRADE (U)</span>
                <span className="font-pixel text-[8px] bg-[#102040] text-white px-1 py-0.2 border border-[#102040]">
                  U
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#64748B] leading-tight">
                Upgrade owned business to L1 / L2
              </span>
            </button>

            {/* Forced Sale */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenForcedSale}
              className="
                flex flex-col items-start p-2 bg-[#EAE5D9] text-[#102040] text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#FFCC00]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">FORCED SALE</span>
              </div>
              <span className="font-mono text-[10px] text-[#102040]/80 leading-tight">
                Liquidate asset for debt relief
              </span>
            </button>

            {/* Steal Talent */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenSteal}
              className="
                flex flex-col items-start p-2 bg-[#EAE5D9] text-[#102040] text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#FFCC00]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[52px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-pixel text-xs uppercase font-black">STEAL TALENT</span>
              </div>
              <span className="font-mono text-[10px] text-[#102040]/80 leading-tight">
                Transfer ₹100 from target team
              </span>
            </button>
          </div>
        </div>

        {/* GROUP 2: Cards and Events (Bonus Card, Crisis Card, Lose Feature) */}
        <div className="lg:col-span-4 bg-[#162952] border-2 border-white/20 p-2.5 sm:p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] text-[#5C94FC] uppercase font-bold tracking-wider">
              2. CARDS & EVENTS
            </span>
            <span className="font-mono text-[10px] text-[#94A3B8]">
              Tile draws & penalties
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {/* Bonus Card */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenBonusCard}
              className="
                flex flex-col items-start p-2 bg-[#3B82F6] text-white text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#2563EB]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[46px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <span className="font-pixel text-xs uppercase font-black">BONUS CARD</span>
              <span className="font-mono text-[10px] text-white/90 leading-tight">
                Grant or Angel Investor (+Cash/CV)
              </span>
            </button>

            {/* Crisis Card */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenCrisisCard}
              className="
                flex flex-col items-start p-2 bg-[#D32F2F] text-white text-left
                border-2 border-[#102040] shadow-[2px_2px_0px_#102040] hover:bg-[#B71C1C]
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[46px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <span className="font-pixel text-xs uppercase font-black">CRISIS CARD</span>
              <span className="font-mono text-[10px] text-white/90 leading-tight">
                Server Crash, Tax, or Legal penalty
              </span>
            </button>

            {/* Lose Feature */}
            <button
              type="button"
              disabled={disabled}
              onClick={onOpenLoseFeature}
              className="
                flex flex-col items-start p-2 bg-[#334155] text-[#CBD5E1] text-left
                border-2 border-white/20 shadow-[2px_2px_0px_#102040] hover:bg-[#475569] hover:text-white
                active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                transition-all min-h-[46px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
              "
            >
              <span className="font-pixel text-xs uppercase font-bold">LOSE FEATURE</span>
              <span className="font-mono text-[10px] text-[#94A3B8] leading-tight">
                Downgrade upgrade level (Tech debt)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
