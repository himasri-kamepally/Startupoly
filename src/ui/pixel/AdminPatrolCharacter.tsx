import React, { useState, useEffect } from 'react';
import { PixelPoly } from './PixelPoly';

export const ADMIN_PHRASES = [
  'ADMIN MODE!',
  'CONTROL THE GAME!',
  'READY TO MANAGE?',
  'LET’S BUILD!',
] as const;

export const TEAM_PHRASES = [
  'TEAM MODE!',
  'COMPLETE TASKS!',
  'EARN YOUR SCORE!',
  'BUILD TOGETHER!',
] as const;

export interface AdminPatrolCharacterProps {
  size?: number;
  className?: string;
  hasPlatform?: boolean;
  phrases?: readonly string[];
}

export const AdminPatrolCharacter: React.FC<AdminPatrolCharacterProps> = ({
  size = 48,
  className = '',
  hasPlatform = true,
  phrases = ADMIN_PHRASES,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [phrases]);

  return (
    <div
      className={`relative w-full pointer-events-none select-none z-20 ${className}`}
      aria-hidden="true"
    >
      {/* Roaming Mascot Moving Left-to-Right and Right-to-Left */}
      <div className="relative w-full h-14 overflow-visible">
        <div className="anim-admin-patrol-track">
          <div className="anim-admin-patrol-facer flex flex-col items-center">
            {/* Rotating Speech Bubble (Counter-scaled to stay upright) */}
            <div className="anim-admin-bubble-counter absolute bottom-full mb-1 flex flex-col items-center pointer-events-none z-30">
              <div className="bg-white border-2 border-[#102040] shadow-[2px_2px_0px_#102040] px-2 py-0.5 whitespace-nowrap">
                <span className="font-pixel text-[9px] text-[#102040] font-bold block">
                  {phrases[phraseIndex]}
                </span>
              </div>
              {/* Bubble Tail */}
              <div className="w-1.5 h-1 bg-[#102040]" />
            </div>

            {/* PixelPoly with active walking animation */}
            <PixelPoly size={size} animation="walk" className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Small Aligned Green Grass Platform with Soil Layer */}
      {hasPlatform && (
        <div className="w-full flex flex-col">
          {/* Level Green Grass Terrace */}
          <div className="w-full h-2.5 bg-[#22B14C] border-t-2 border-[#4ADE80] border-b-2 border-[#166534] shadow-[0_-1px_0_#102040]" />
          {/* Thin Brown Soil Layer */}
          <div className="w-full h-1 bg-[#8B4513] border-b border-[#5C2E0A]" />
        </div>
      )}
    </div>
  );
};

export const TeamPatrolCharacter: React.FC<Omit<AdminPatrolCharacterProps, 'phrases'>> = (props) => (
  <AdminPatrolCharacter {...props} phrases={TEAM_PHRASES} />
);
