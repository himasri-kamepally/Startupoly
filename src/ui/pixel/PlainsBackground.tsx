import React from 'react';
import { PixelCloudFluffy } from './PixelCloudFluffy';
import { PixelQuestionBlock } from './PixelQuestionBlock';
import { PixelCoin } from './PixelCoin';
import { PixelGrassTuft } from './PixelGrassTuft';
import { PixelFlower } from './PixelFlower';
import { PixelPipe } from './PixelPipe';
import { PixelBrickTile } from './PixelBrickTile';
import { PixelSparkle } from './PixelSparkle';

export interface PlainsBackgroundProps {
  children: React.ReactNode;
}

export const PlainsBackground: React.FC<PlainsBackgroundProps> = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#3B82F6] via-[#5C94FC] to-[#87CEEB] flex flex-col justify-between relative overflow-hidden select-none anim-scene-transition"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* ======================================================================= */}
      {/* LAYER 1: Distant Layered Mountains (Matching Main Page 3-Layer Depth)    */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 1440 280"
          className="absolute inset-x-0 bottom-8 w-full h-44 sm:h-64 object-cover object-bottom"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="plainsBackMtnLit" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4EBFE" />
              <stop offset="100%" stopColor="#A2CEF5" />
            </linearGradient>
            <linearGradient id="plainsBackMtnShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B4D7F6" />
              <stop offset="100%" stopColor="#86B8E8" />
            </linearGradient>

            <linearGradient id="plainsMidMtnLit" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6EA8E6" />
              <stop offset="100%" stopColor="#4282C8" />
            </linearGradient>
            <linearGradient id="plainsMidMtnShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4E87C8" />
              <stop offset="100%" stopColor="#306AA8" />
            </linearGradient>

            <linearGradient id="plainsFrontMtnLit" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B7AC6" />
              <stop offset="100%" stopColor="#205698" />
            </linearGradient>
            <linearGradient id="plainsFrontMtnShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#234E84" />
              <stop offset="100%" stopColor="#123462" />
            </linearGradient>

            <linearGradient id="plainsGreenHills" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>

          {/* Distant Layer (Faded Light Blue) */}
          <g opacity="0.55">
            <polygon points="-20,260 140,110 140,260" fill="url(#plainsBackMtnLit)" />
            <polygon points="140,110 280,260 140,260" fill="url(#plainsBackMtnShadow)" />
            <polygon points="126,132 140,110 154,132 140,138" fill="#FFFFFF" opacity="0.75" />

            <polygon points="340,260 510,105 510,260" fill="url(#plainsBackMtnLit)" />
            <polygon points="510,105 670,260 510,260" fill="url(#plainsBackMtnShadow)" />
            <polygon points="494,128 510,105 526,128 510,135" fill="#FFFFFF" opacity="0.75" />

            <polygon points="760,260 920,112 920,260" fill="url(#plainsBackMtnLit)" />
            <polygon points="920,112 1070,260 920,260" fill="url(#plainsBackMtnShadow)" />
            <polygon points="906,134 920,112 934,134 920,140" fill="#FFFFFF" opacity="0.72" />

            <polygon points="1120,260 1280,118 1280,260" fill="url(#plainsBackMtnLit)" />
            <polygon points="1280,118 1440,260 1280,260" fill="url(#plainsBackMtnShadow)" />
            <polygon points="1264,138 1280,118 1296,138 1280,144" fill="#FFFFFF" opacity="0.75" />
          </g>

          {/* Middle Layer (Medium Blue) */}
          <g opacity="0.82">
            <polygon points="80,270 260,92 260,270" fill="url(#plainsMidMtnLit)" />
            <polygon points="260,92 430,270 260,270" fill="url(#plainsMidMtnShadow)" />
            <polygon points="238,124 260,92 282,124 260,134" fill="#FFFFFF" opacity="0.88" />
            <line x1="260" y1="92" x2="260" y2="270" stroke="#BAE6FD" strokeWidth="2" opacity="0.6" />

            <polygon points="500,270 690,100 690,270" fill="url(#plainsMidMtnLit)" />
            <polygon points="690,100 870,270 690,270" fill="url(#plainsMidMtnShadow)" />
            <polygon points="670,128 690,100 710,128 690,138" fill="#FFFFFF" opacity="0.88" />
            <line x1="690" y1="100" x2="690" y2="270" stroke="#BAE6FD" strokeWidth="1.8" opacity="0.6" />

            <polygon points="920,270 1100,90 1100,270" fill="url(#plainsMidMtnLit)" />
            <polygon points="1100,90 1280,270 1100,270" fill="url(#plainsMidMtnShadow)" />
            <polygon points="1078,122 1100,90 1122,122 1100,132" fill="#FFFFFF" opacity="0.88" />
            <line x1="1100" y1="90" x2="1100" y2="270" stroke="#BAE6FD" strokeWidth="2" opacity="0.6" />
          </g>

          {/* Front Layer (Deeper Blue with Stepped Shadows) */}
          <g opacity="1.0">
            <polygon points="180,280 370,82 370,280" fill="url(#plainsFrontMtnLit)" />
            <polygon points="370,82 550,280 370,280" fill="url(#plainsFrontMtnShadow)" />
            <polygon points="340,122 370,82 400,122 370,140" fill="#FFFFFF" opacity="0.95" />
            <polygon points="350,140 370,140 384,152 360,152" fill="#E0F2FE" opacity="0.8" />
            <line x1="370" y1="82" x2="370" y2="280" stroke="#7DD3FC" strokeWidth="2.5" opacity="0.85" />
            <rect x="375" y="146" width="24" height="4" fill="#0C203E" opacity="0.28" />
            <rect x="410" y="184" width="28" height="5" fill="#0C203E" opacity="0.28" />

            <polygon points="620,280 810,88 810,280" fill="url(#plainsFrontMtnLit)" />
            <polygon points="810,88 990,280 810,280" fill="url(#plainsFrontMtnShadow)" />
            <polygon points="782,126 810,88 838,126 810,142" fill="#FFFFFF" opacity="0.95" />
            <polygon points="790,142 810,142 822,154 800,154" fill="#E0F2FE" opacity="0.8" />
            <line x1="810" y1="88" x2="810" y2="280" stroke="#7DD3FC" strokeWidth="2.5" opacity="0.85" />
            <rect x="815" y="150" width="24" height="4" fill="#0C203E" opacity="0.28" />
            <rect x="848" y="188" width="28" height="5" fill="#0C203E" opacity="0.28" />

            <polygon points="1030,280 1210,84 1210,280" fill="url(#plainsFrontMtnLit)" />
            <polygon points="1210,84 1390,280 1210,280" fill="url(#plainsFrontMtnShadow)" />
            <polygon points="1180,124 1210,84 1240,124 1210,140" fill="#FFFFFF" opacity="0.95" />
            <polygon points="1188,140 1210,140 1224,152 1200,152" fill="#E0F2FE" opacity="0.8" />
            <line x1="1210" y1="84" x2="1210" y2="280" stroke="#7DD3FC" strokeWidth="2.5" opacity="0.85" />
            <rect x="1215" y="148" width="24" height="4" fill="#0C203E" opacity="0.28" />
            <rect x="1250" y="186" width="28" height="5" fill="#0C203E" opacity="0.28" />
          </g>

          {/* Foreground Low Rolling Green Foothill */}
          <path
            d="M -10,280 Q 240,240 500,250 T 1000,242 T 1460,252 L 1460,280 Z"
            fill="url(#plainsGreenHills)"
            stroke="#102040"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* ======================================================================= */}
      {/* LAYER 2: Sky Details (Drifting Cloud Lanes, Birds, Sparkles)           */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky Sparkles in Flanks */}
        <div className="absolute top-3 left-8 sm:left-14 anim-sparkle-cycle opacity-75">
          <PixelSparkle size={12} />
        </div>
        <div className="absolute top-12 left-22 sm:left-32 anim-sparkle-cycle opacity-60" style={{ animationDelay: '-1.4s' }}>
          <PixelSparkle size={8} />
        </div>
        <div className="absolute top-4 right-10 sm:right-18 anim-sparkle-cycle opacity-75" style={{ animationDelay: '-0.8s' }}>
          <PixelSparkle size={12} />
        </div>
        <div className="absolute top-14 right-24 sm:right-36 anim-sparkle-cycle opacity-60" style={{ animationDelay: '-2.1s' }}>
          <PixelSparkle size={8} />
        </div>

        {/* Distant Gliding Pixel Birds in High Sky */}
        <div className="absolute top-6 left-[20%] sm:left-[26%] opacity-55 pointer-events-none flex items-center gap-3">
          <svg width="12" height="7" viewBox="0 0 14 8" fill="none" className="shrink-0 anim-float-bob">
            <path d="M 0,3 L 3,1 L 6,3 L 7,4 L 8,3 L 11,1 L 14,3 L 11,2 L 7,5 L 3,2 Z" fill="#1E3A5F" />
          </svg>
          <svg width="9" height="5" viewBox="0 0 14 8" fill="none" className="shrink-0 anim-float-bob" style={{ animationDelay: '-1.0s' }}>
            <path d="M 0,3 L 3,1 L 6,3 L 7,4 L 8,3 L 11,1 L 14,3 L 11,2 L 7,5 L 3,2 Z" fill="#1E3A5F" />
          </svg>
        </div>

        {/* Cloud Lane 1: Upper High Clouds (Slow 110s Drift) */}
        <div className="absolute inset-x-0 top-2 sm:top-4 h-16 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-far opacity-50" style={{ animationDelay: '-18s' }}>
            <div className="w-1/2 relative h-16 shrink-0">
              <div className="absolute top-1 left-[10%]">
                <PixelCloudFluffy size={44} />
              </div>
              <div className="absolute top-2 left-[84%]">
                <PixelCloudFluffy size={40} />
              </div>
            </div>
            <div className="w-1/2 relative h-16 shrink-0">
              <div className="absolute top-1 left-[10%]">
                <PixelCloudFluffy size={44} />
              </div>
              <div className="absolute top-2 left-[84%]">
                <PixelCloudFluffy size={40} />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Lane 2: Mid Cloud Row (Medium 70s Drift) */}
        <div className="absolute inset-x-0 top-12 sm:top-16 h-14 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-mid opacity-40" style={{ animationDelay: '-38s' }}>
            <div className="w-1/2 relative h-14 shrink-0">
              <div className="absolute top-1 left-[6%]">
                <PixelCloudFluffy size={36} />
              </div>
              <div className="absolute top-2 left-[68%]">
                <PixelCloudFluffy size={38} />
              </div>
            </div>
            <div className="w-1/2 relative h-14 shrink-0">
              <div className="absolute top-1 left-[6%]">
                <PixelCloudFluffy size={36} />
              </div>
              <div className="absolute top-2 left-[68%]">
                <PixelCloudFluffy size={38} />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Lane 3: Lower Parallax Row (45s Drift) */}
        <div className="absolute inset-x-0 top-24 sm:top-30 h-12 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-near opacity-30" style={{ animationDelay: '-10s' }}>
            <div className="w-1/2 relative h-12 shrink-0">
              <div className="absolute top-1 left-[26%]">
                <PixelCloudFluffy size={30} />
              </div>
              <div className="absolute top-2 left-[90%]">
                <PixelCloudFluffy size={32} />
              </div>
            </div>
            <div className="w-1/2 relative h-12 shrink-0">
              <div className="absolute top-1 left-[26%]">
                <PixelCloudFluffy size={30} />
              </div>
              <div className="absolute top-2 left-[90%]">
                <PixelCloudFluffy size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* LAYER 3: Clean Flanking Floating Islands (Coins & ? Block)              */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* UPPER-LEFT FLOATING ACCENT: 2 Gold Coins + Grassy Platform + ? Block */}
        <div className="hidden sm:block absolute top-14 sm:top-18 left-4 sm:left-10 lg:left-14">
          <div className="relative flex flex-col items-center">
            {/* 2 Gold Coins hovering */}
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <div className="anim-coin-idle">
                <PixelCoin size={18} />
              </div>
              <div className="anim-coin-idle" style={{ animationDelay: '-0.4s' }}>
                <PixelCoin size={18} />
              </div>
            </div>

            {/* Grassy Brick Platform Base */}
            <div className="relative">
              <div className="h-2 w-24 bg-[#22B14C] border-t-2 border-x-2 border-[#102040]" />
              <div className="h-4 w-24 bg-[#B84418] border-2 border-[#102040] relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#8B2500] absolute top-0.5 left-2" />
                <div className="w-2 h-1 bg-[#FF8C00] absolute bottom-0.5 right-3" />
              </div>
            </div>

            {/* Floating Question Block Below Platform */}
            <div className="mt-8 anim-block-cycle">
              <PixelQuestionBlock size={28} />
            </div>
          </div>
        </div>

        {/* MID-RIGHT FLOATING ACCENT: 1 Coin + Platform */}
        <div className="hidden sm:block absolute top-32 sm:top-40 right-4 sm:right-10 lg:right-14">
          <div className="relative flex flex-col items-center">
            <div className="anim-coin-idle mb-1">
              <PixelCoin size={20} />
            </div>

            <div className="relative">
              <div className="h-2 w-20 bg-[#22B14C] border-t-2 border-x-2 border-[#102040]" />
              <div className="h-4 w-20 bg-[#B84418] border-2 border-[#102040] relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#8B2500] absolute top-0.5 left-2" />
                <div className="w-2 h-1 bg-[#FF8C00] absolute bottom-0.5 right-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* LAYER 4: Main Foreground Content (Signboard Mounted onto the scene)     */}
      {/* ======================================================================= */}
      <div className="relative z-20 flex-1 flex flex-col justify-between">
        {children}
      </div>

      {/* ======================================================================= */}
      {/* LAYER 5: Ground Scene Layer & Full-Width Brick Base                     */}
      {/* ======================================================================= */}
      <div className="relative z-30 w-full">
        {/* Ground Objects Layer resting directly on top of the grass turf */}
        <div className="absolute inset-x-0 bottom-full pointer-events-none z-10">
          {/* Left Ground Objects: Daisy Flower + Grass + Warp Pipe */}
          <div className="absolute bottom-0 left-2 sm:left-6 lg:left-10 flex items-end gap-1 sm:gap-2">
            <div className="flex items-end gap-0.5 mb-0.5">
              <PixelFlower size={18} variant={1} />
              <PixelGrassTuft size={16} variant={1} />
            </div>

            {/* Classic Green Warp Pipe */}
            <div className="flex flex-col items-center">
              <div className="anim-pipe-highlight">
                <PixelPipe width={52} height={46} />
              </div>
            </div>

            <div className="flex items-end gap-0.5 mb-0.5">
              <PixelGrassTuft size={16} variant={2} />
              <PixelFlower size={16} variant={2} />
            </div>
          </div>

          {/* Right Ground Objects: Grass & Flowers cluster */}
          <div className="absolute bottom-0 right-2 sm:right-6 lg:right-10 flex items-end gap-1 sm:gap-1.5">
            <div className="flex items-end gap-0.5 mb-0.5">
              <PixelGrassTuft size={16} variant={1} />
              <PixelFlower size={18} variant={1} />
              <PixelGrassTuft size={16} variant={2} />
              <PixelFlower size={16} variant={2} />
            </div>
          </div>
        </div>

        {/* Full-width Pixel Brick Turf Tile */}
        <PixelBrickTile hasGrass={true} className="h-7 sm:h-8 w-full" />
        <div className="bg-[#102040] pt-1.5 sm:pt-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] px-4 text-center border-t-2 border-[#FFCC00]">
          <p className="font-pixel text-[8px] sm:text-[9px] text-[#FFCC00] tracking-wider">
            ★ &nbsp; STARTUPOLY © 2026 &nbsp; ★
          </p>
        </div>
      </div>
    </div>
  );
};
