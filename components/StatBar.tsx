import React from 'react';
import { PlayerStats } from '../types';

interface StatBarProps {
  stats: PlayerStats;
  justEarned?: number;
}

const StatBar: React.FC<StatBarProps> = ({ stats, justEarned }) => {
  const pct = Math.min(100, Math.round((stats.levelXp / stats.levelNeed) * 100));

  return (
    <div className="w-full max-w-lg mx-auto mb-6 bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full carrot-gradient flex items-center justify-center text-white font-black text-sm">
        {stats.level}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-bold text-orange-700 truncate">{stats.title}</span>
          <span className="text-[11px] font-bold text-orange-400">
            {stats.levelXp} / {stats.levelNeed} XP
          </span>
        </div>
        <div className="h-2 bg-orange-50 rounded-full overflow-hidden border border-orange-100 mt-1">
          <div
            className="h-full carrot-gradient transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
      {typeof justEarned === 'number' && justEarned > 0 && (
        <span className="flex-shrink-0 text-xs font-black text-green-600 animate-fadeIn">
          +{justEarned}
        </span>
      )}
    </div>
  );
};

export default StatBar;
