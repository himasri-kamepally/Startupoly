import React from 'react';
import { PixelCloudFluffy } from './PixelCloudFluffy';
import { PixelBrickTile } from './PixelBrickTile';
import { PixelSparkle } from './PixelSparkle';

export interface CastleBackgroundProps {
  isGateOpen?: boolean;
  children: React.ReactNode;
}

export const CastleBackground: React.FC<CastleBackgroundProps> = ({
  isGateOpen = false,
  children,
}) => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#3B82F6] via-[#5C94FC] to-[#87CEEB] flex flex-col justify-between relative overflow-hidden select-none anim-scene-transition"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* ======================================================================= */}
      {/* Sky & Drifting Clouds (3 Distinct Lanes with Slow Parallax)             */}
      {/* ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky Sparkles in Unused High Flank Areas */}
        <div className="absolute top-3 left-8 sm:left-16 anim-sparkle-cycle opacity-75">
          <PixelSparkle size={12} />
        </div>
        <div className="absolute top-12 left-24 sm:left-36 anim-sparkle-cycle opacity-60" style={{ animationDelay: '-1.5s' }}>
          <PixelSparkle size={8} />
        </div>
        <div className="absolute top-4 right-10 sm:right-20 anim-sparkle-cycle opacity-75" style={{ animationDelay: '-0.8s' }}>
          <PixelSparkle size={12} />
        </div>
        <div className="absolute top-14 right-28 sm:right-40 anim-sparkle-cycle opacity-60" style={{ animationDelay: '-2.2s' }}>
          <PixelSparkle size={8} />
        </div>

        {/* Distant Gliding Pixel Birds in High Sky */}
        <div className="absolute top-6 left-[18%] sm:left-[24%] opacity-55 pointer-events-none flex items-center gap-3">
          <svg width="12" height="7" viewBox="0 0 14 8" fill="none" className="shrink-0 anim-float-bob">
            <path d="M 0,3 L 3,1 L 6,3 L 7,4 L 8,3 L 11,1 L 14,3 L 11,2 L 7,5 L 3,2 Z" fill="#1E3A5F" />
          </svg>
          <svg width="9" height="5" viewBox="0 0 14 8" fill="none" className="shrink-0 anim-float-bob" style={{ animationDelay: '-1.0s' }}>
            <path d="M 0,3 L 3,1 L 6,3 L 7,4 L 8,3 L 11,1 L 14,3 L 11,2 L 7,5 L 3,2 Z" fill="#1E3A5F" />
          </svg>
        </div>

        {/* Cloud Lane 1: Upper High Clouds (Slow 110s Parallax Drift) */}
        <div className="absolute inset-x-0 top-2 sm:top-3 h-16 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-far opacity-50" style={{ animationDelay: '-20s' }}>
            <div className="w-1/2 relative h-16 shrink-0">
              <div className="absolute top-1 left-[12%]">
                <PixelCloudFluffy size={44} />
              </div>
              <div className="absolute top-2 left-[82%]">
                <PixelCloudFluffy size={40} />
              </div>
            </div>
            <div className="w-1/2 relative h-16 shrink-0">
              <div className="absolute top-1 left-[12%]">
                <PixelCloudFluffy size={44} />
              </div>
              <div className="absolute top-2 left-[82%]">
                <PixelCloudFluffy size={40} />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Lane 2: Mid Cloud Row (Medium 70s Drift) */}
        <div className="absolute inset-x-0 top-12 sm:top-14 h-14 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-mid opacity-40" style={{ animationDelay: '-40s' }}>
            <div className="w-1/2 relative h-14 shrink-0">
              <div className="absolute top-1 left-[4%]">
                <PixelCloudFluffy size={36} />
              </div>
              <div className="absolute top-2 left-[64%]">
                <PixelCloudFluffy size={38} />
              </div>
            </div>
            <div className="w-1/2 relative h-14 shrink-0">
              <div className="absolute top-1 left-[4%]">
                <PixelCloudFluffy size={36} />
              </div>
              <div className="absolute top-2 left-[64%]">
                <PixelCloudFluffy size={38} />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Lane 3: Additional Clean Cloud Row (45s Parallax Drift in Separate Lane) */}
        <div className="absolute inset-x-0 top-24 sm:top-28 h-12 overflow-hidden pointer-events-none">
          <div className="flex w-[200%] shrink-0 anim-cloud-drift-near opacity-30" style={{ animationDelay: '-12s' }}>
            <div className="w-1/2 relative h-12 shrink-0">
              <div className="absolute top-1 left-[28%]">
                <PixelCloudFluffy size={32} />
              </div>
              <div className="absolute top-2 left-[92%]">
                <PixelCloudFluffy size={30} />
              </div>
            </div>
            <div className="w-1/2 relative h-12 shrink-0">
              <div className="absolute top-1 left-[28%]">
                <PixelCloudFluffy size={32} />
              </div>
              <div className="absolute top-2 left-[92%]">
                <PixelCloudFluffy size={30} />
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Faded Distant Mountain Silhouettes Behind Castle */}
        <div className="absolute inset-x-0 bottom-12 pointer-events-none opacity-25">
          <svg viewBox="0 0 1440 180" className="w-full h-28 sm:h-36 object-cover object-bottom" preserveAspectRatio="none">
            <polygon points="-40,180 160,50 360,180" fill="#93C5FD" />
            <polygon points="260,180 480,65 700,180" fill="#60A5FA" />
            <polygon points="740,180 960,60 1180,180" fill="#60A5FA" />
            <polygon points="1100,180 1300,55 1500,180" fill="#93C5FD" />
          </svg>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* Castle Fortress Wall & Towers Layer (Behind Signboard)                 */}
      {/* ======================================================================= */}
      <div className="absolute inset-x-0 bottom-8 h-80 sm:h-96 pointer-events-none z-0 flex justify-between items-end">
        {/* Left Castle Tower */}
        <div className="hidden sm:flex w-36 h-full flex-col items-center">
          {/* Flag */}
          <div className="w-8 h-5 bg-[#D32F2F] border-2 border-[#102040] anim-flag self-start ml-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#FFCC00]" />
          </div>
          {/* Flagpole */}
          <div className="w-1.5 h-6 bg-[#102040] self-start ml-4" />
          {/* Tower Top Battlements / Crenellations */}
          <div className="w-full flex justify-between">
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
          </div>
          {/* Tower Body */}
          <div className="w-full flex-1 bg-[#334155] border-x-4 border-[#102040] relative castle-stone-pattern">
            {/* Castle Window / Slit */}
            <div className="w-4 h-8 bg-[#102040] mx-auto mt-6 rounded-t-sm" />
            {/* Wall Torch */}
            <div className="absolute top-20 right-3 flex flex-col items-center anim-torch">
              <div className="w-3 h-3 bg-[#FFCC00] border border-[#102040] rounded-full" />
              <div className="w-1.5 h-3 bg-[#8B4513]" />
            </div>
          </div>
        </div>

        {/* Center Castle Gate & Main Wall */}
        <div className="flex-1 h-64 sm:h-72 bg-[#475569] border-t-4 border-x-4 border-[#102040] relative castle-stone-pattern flex flex-col justify-between">
          {/* Center Wall Crenellations */}
          <div className="w-full flex justify-around -mt-4">
            <div className="w-8 h-4 bg-[#475569] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-8 h-4 bg-[#475569] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-8 h-4 bg-[#475569] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-8 h-4 bg-[#475569] border-t-4 border-x-4 border-[#102040]" />
          </div>

          {/* Torches framing the gate area */}
          <div className="hidden sm:flex w-full justify-between px-12 sm:px-24 mt-4">
            <div className="flex flex-col items-center anim-torch">
              <div className="w-3.5 h-3.5 bg-[#FFCC00] border border-[#102040] rounded-full" />
              <div className="w-1.5 h-4 bg-[#8B4513] border border-[#102040]" />
            </div>
            <div className="flex flex-col items-center anim-torch">
              <div className="w-3.5 h-3.5 bg-[#FFCC00] border border-[#102040] rounded-full" />
              <div className="w-1.5 h-4 bg-[#8B4513] border border-[#102040]" />
            </div>
          </div>

          {/* Castle Arched Gate / Portcullis */}
          <div className="w-36 sm:w-52 h-40 sm:h-48 bg-[#102040] mx-auto rounded-t-full border-t-4 border-x-4 border-[#102040] relative overflow-hidden">
            {/* Iron Portcullis Grid that opens on success */}
            <div
              className={`w-full h-full bg-[#1E293B] border-t-2 border-[#475569] flex flex-col justify-around py-2 ${
                isGateOpen ? 'anim-gate-open' : ''
              }`}
            >
              <div className="w-full h-1 bg-[#64748B]" />
              <div className="w-full h-1 bg-[#64748B]" />
              <div className="w-full h-1 bg-[#64748B]" />
              <div className="w-full h-1 bg-[#64748B]" />
            </div>
          </div>
        </div>

        {/* Right Castle Tower */}
        <div className="hidden sm:flex w-36 h-full flex-col items-center">
          {/* Flag */}
          <div className="w-8 h-5 bg-[#22B14C] border-2 border-[#102040] anim-flag self-end mr-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#FFCC00]" />
          </div>
          {/* Flagpole */}
          <div className="w-1.5 h-6 bg-[#102040] self-end mr-4" />
          {/* Tower Top Battlements */}
          <div className="w-full flex justify-between">
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
            <div className="w-6 h-6 bg-[#334155] border-t-4 border-x-4 border-[#102040]" />
          </div>
          {/* Tower Body */}
          <div className="w-full flex-1 bg-[#334155] border-x-4 border-[#102040] relative castle-stone-pattern">
            {/* Castle Window / Slit */}
            <div className="w-4 h-8 bg-[#102040] mx-auto mt-6 rounded-t-sm" />
            {/* Wall Torch */}
            <div className="absolute top-20 left-3 flex flex-col items-center anim-torch">
              <div className="w-3 h-3 bg-[#FFCC00] border border-[#102040] rounded-full" />
              <div className="w-1.5 h-3 bg-[#8B4513]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Foreground Content (Signboard Mounted on the scene) */}
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        {children}
      </div>

      {/* ======================================================================= */}
      {/* Brick Ground Base Strip                                                 */}
      {/* ======================================================================= */}
      <div className="relative z-20 w-full">
        <PixelBrickTile hasGrass={true} className="h-8 sm:h-10 w-full" />
      </div>
    </div>
  );
};
