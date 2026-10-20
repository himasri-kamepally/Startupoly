import React from 'react';
import { PixelCard, BigNumber } from '../../ui';
import { PixelCoin, PixelCloud } from '../../ui/pixel';
import { formatINR } from '../../lib/format';
import { TeamStateResponse } from '../../data/rpc';

interface LobbyWaitViewProps {
  state: TeamStateResponse;
}

export const LobbyWaitView: React.FC<LobbyWaitViewProps> = ({ state }) => {
  const { team } = state;

  return (
    <div className="flex flex-col gap-4">
      {/* Waiting Banner Card */}
      <PixelCard title="LOBBY CONNECTED • WAITING ROOM" headerBg="green" padding="lg">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="relative">
            <PixelCloud size={72} className="opacity-90 anim-cloud-float" />
            <div className="w-12 h-12 bg-[#FFCC00] border-3 border-[#102040] shadow-[2px_2px_0px_#102040] flex items-center justify-center font-pixel text-xl text-[#102040] mx-auto -mt-6 relative z-10">
              🎮
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {state.room?.code && (
              <span className="font-mono font-black text-xs sm:text-sm bg-[#FFCC00] text-[#102040] border-2 border-[#102040] px-2.5 py-0.5 shadow-[1px_1px_0px_#102040]">
                ROOM {state.room.code}
              </span>
            )}
            <span className="font-pixel text-[10px] bg-[#DCFCE7] text-[#166534] border-2 border-[#166534] px-2.5 py-0.5 font-bold shadow-[1px_1px_0px_#166534]">
              ● CONNECTED
            </span>
          </div>

          <h2 className="font-pixel text-sm sm:text-base text-[#102040] uppercase">
            WAITING FOR THE ADMIN TO START THE GAME
          </h2>

          <p className="font-mono text-xs text-[#64748B] max-w-xs leading-relaxed">
            Your phone is connected and synced with the scoreboard. Teams cannot start the match themselves. The 50-minute gameplay timer will begin automatically when the admin presses "Start Game."
          </p>

          <div className="mt-2 inline-flex items-center gap-2 bg-[#FAF8F5] border-2 border-[#102040] px-3 py-1.5 shadow-[2px_2px_0px_#102040]">
            <span
              className="w-3.5 h-3.5 border border-[#102040]"
              style={{ backgroundColor: team.color }}
            />
            <span className="font-pixel text-xs text-[#102040]">
              SLOT #{team.slot}: {team.name}
            </span>
          </div>
        </div>
      </PixelCard>

      {/* Starting Stats Overview */}
      <PixelCard title="STARTING PORTFOLIO" headerBg="navy" padding="md">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <BigNumber
            label="STARTING CASH"
            value={formatINR(team.cash)}
            variant="green"
            size="sm"
            icon={<PixelCoin size={20} />}
          />
          <BigNumber
            label="STARTING CV"
            value={`${team.cv} CV`}
            variant="navy"
            size="sm"
          />
        </div>

        <div className="bg-white border-2 border-[#102040] p-3 text-center">
          <span className="font-pixel text-[10px] text-[#64748B] block uppercase mb-1">
            BUSINESS CAPACITY
          </span>
          <span className="font-mono font-extrabold text-sm text-[#102040]">
            0 / 3 Businesses Owned
          </span>
        </div>
      </PixelCard>
    </div>
  );
};
