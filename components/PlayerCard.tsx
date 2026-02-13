import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
}

const getPositionColor = (pos: string) => {
  switch (pos) {
    case 'GK': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
    case 'DEF': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
    case 'MID': return 'bg-green-500/20 text-green-500 border-green-500/20';
    case 'FWD': return 'bg-red-500/20 text-red-500 border-red-500/20';
    default: return 'bg-slate-500/20 text-slate-500';
  }
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <div className="flex items-center p-3 bg-surface rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer mb-3">
      <div className="relative">
        <img 
          src={player.avatar} 
          alt={player.name} 
          className="w-12 h-12 rounded-full border-2 border-slate-600 object-cover"
        />
        {player.isCaptain && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-surface">
            K
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-1">
        <h3 className="text-white font-medium">{player.name}</h3>
        <div className="flex items-center mt-1 space-x-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPositionColor(player.position)}`}>
            {player.position}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="flex items-center bg-slate-900 rounded px-2 py-1">
          <span className="text-sm font-bold text-primary">{player.rating}</span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1">Puan</span>
      </div>
    </div>
  );
};