import React from 'react';
import { formatActivityEvent } from '../../../domain/activityText';
import { AdminRoomSnapshot } from '../../../data/rpc';

export interface ActivityRowProps {
  event: AdminRoomSnapshot['events'][0];
  teams: AdminRoomSnapshot['teams'];
  isGroupedWithPrevious?: boolean;
}

export const ActivityRow: React.FC<ActivityRowProps> = ({
  event,
  teams,
  isGroupedWithPrevious = false,
}) => {
  const human = formatActivityEvent(event, teams);

  // Format local HH:MM:SS timestamp
  let timeFormatted = '--:--:--';
  try {
    if (event.created_at) {
      const date = new Date(event.created_at);
      timeFormatted = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  } catch {
    // fallback
  }

  return (
    <div
      className={`
        p-2.5 bg-[#FAF8F5] border-b border-[#CBD5E1] text-xs flex flex-col gap-1.5 transition-colors hover:bg-white
        ${isGroupedWithPrevious ? 'border-l-4 border-l-[#3B82F6]' : ''}
        ${human.isCorrection ? 'bg-[#FFFBEB]/70' : ''}
      `}
    >
      {/* Top line: timestamp, team chip, badges */}
      <div className="flex items-center justify-between gap-1.5 font-mono text-[10px] text-[#64748B]">
        <div className="flex items-center gap-2 truncate">
          <span title={event.created_at} className="bg-[#1E293B] text-white px-1.5 py-0.2 border border-white/20 font-bold">
            {timeFormatted}
          </span>

          {human.teamName && (
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 border border-[#102040] flex-shrink-0 shadow-[1px_1px_0px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: human.teamColor || '#102040' }}
                aria-hidden="true"
              />
              <span className="font-pixel text-[9px] text-[#102040] truncate max-w-[120px] font-bold">
                {human.teamName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {human.isCorrection && (
            <span className="font-pixel text-[8px] bg-[#D32F2F] text-white px-1.5 py-0.5 border border-[#102040] font-bold shadow-[1px_1px_0px_#102040]">
              ADMIN CORRECTION
            </span>
          )}
          {event.group_id && (
            <span className="font-mono text-[8px] bg-[#EAE5D9] text-[#102040] px-1 py-0.5 border border-[#102040]">
              MULTI
            </span>
          )}
        </div>
      </div>

      {/* Main sentence and delta */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-sans text-xs text-[#102040] font-medium leading-snug">
          {human.sentence}
        </span>

        {human.deltaText && (
          <span
            className={`font-mono text-xs font-bold px-1.5 py-0.5 border flex-shrink-0 shadow-[1px_1px_0px_rgba(0,0,0,0.1)] ${
              human.isPositive
                ? 'bg-[#E8F8EE] text-[#166534] border-[#22B14C]'
                : human.isNegative
                ? 'bg-[#FEECEB] text-[#D32F2F] border-[#D32F2F]'
                : 'bg-[#FAF8F5] text-[#102040] border-[#102040]'
            }`}
          >
            {human.deltaText}
          </span>
        )}
      </div>

      {/* Optional Note pill */}
      {human.note && (
        <div className="bg-[#FFFBEB] border-l-3 border-[#B45309] px-2 py-1 font-mono text-[11px] text-[#92400E] flex items-start gap-1">
          <span className="font-bold">Note:</span>
          <span>"{human.note}"</span>
        </div>
      )}
    </div>
  );
};
