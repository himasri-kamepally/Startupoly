import React from 'react';
import { PixelCloudFluffy } from './PixelCloudFluffy';
import { PixelSparkle } from './PixelSparkle';

export const AdminSkyBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
    >
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

      {/* Minimal Faded Distant Mountain Silhouettes in Lower Sky */}
      <div className="absolute inset-x-0 bottom-12 pointer-events-none opacity-25">
        <svg viewBox="0 0 1440 180" className="w-full h-28 sm:h-36 object-cover object-bottom" preserveAspectRatio="none">
          <polygon points="-40,180 160,50 360,180" fill="#93C5FD" />
          <polygon points="260,180 480,65 700,180" fill="#60A5FA" />
          <polygon points="740,180 960,60 1180,180" fill="#60A5FA" />
          <polygon points="1100,180 1300,55 1500,180" fill="#93C5FD" />
        </svg>
      </div>
    </div>
  );
};
