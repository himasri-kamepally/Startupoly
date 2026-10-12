import React from 'react';

export interface PixelGreenPlatformProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * PixelGreenPlatform: Authentic 16-bit green platform obstacle.
 * Features:
 * - Lush pixelated green grass top with overhang fringe
 * - Sturdy green brick foundation with pixel mortar lines
 * - Firmly touches the flat ground
 */
export const PixelGreenPlatform: React.FC<PixelGreenPlatformProps> = ({
  className = '',
  width = 52,
  height = 30,
}) => {
  return (
    <div
      className={`relative select-none flex-shrink-0 ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 52 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Foundation Green Brick Body */}
        <rect x="2" y="8" width="48" height="22" fill="#15803D" stroke="#102040" strokeWidth="2" />
        
        {/* Shaded Brick Mortar Lines */}
        <line x1="2" y1="18" x2="50" y2="18" stroke="#0E4E26" strokeWidth="2" />
        <line x1="16" y1="8" x2="16" y2="18" stroke="#0E4E26" strokeWidth="1.5" />
        <line x1="36" y1="8" x2="36" y2="18" stroke="#0E4E26" strokeWidth="1.5" />
        <line x1="26" y1="18" x2="26" y2="28" stroke="#0E4E26" strokeWidth="1.5" />
        <line x1="8" y1="18" x2="8" y2="28" stroke="#0E4E26" strokeWidth="1.5" />
        <line x1="44" y1="18" x2="44" y2="28" stroke="#0E4E26" strokeWidth="1.5" />

        {/* Lighter Brick Highlights */}
        <rect x="4" y="10" width="3" height="2" fill="#22C55E" />
        <rect x="20" y="10" width="4" height="2" fill="#22C55E" />
        <rect x="38" y="10" width="3" height="2" fill="#22C55E" />
        <rect x="12" y="20" width="3" height="2" fill="#22C55E" />
        <rect x="30" y="20" width="4" height="2" fill="#22C55E" />

        {/* Top Lush Green Platform Fringe */}
        <rect x="0" y="0" width="52" height="8" fill="#22C55E" stroke="#102040" strokeWidth="2" />
        {/* Bright Highlight Line on Top Edge */}
        <line x1="2" y1="2" x2="50" y2="2" stroke="#86EFAC" strokeWidth="1.5" />
        
        {/* Hanging Grass Drops */}
        <rect x="6" y="8" width="4" height="3" fill="#22C55E" stroke="#102040" strokeWidth="1" />
        <rect x="18" y="8" width="5" height="4" fill="#22C55E" stroke="#102040" strokeWidth="1" />
        <rect x="32" y="8" width="4" height="3" fill="#22C55E" stroke="#102040" strokeWidth="1" />
        <rect x="42" y="8" width="5" height="4" fill="#22C55E" stroke="#102040" strokeWidth="1" />
      </svg>
    </div>
  );
};
