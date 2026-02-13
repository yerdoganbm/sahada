import React from 'react';
import { Match } from '../types';
import { Icon } from './Icon';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  const isUpcoming = match.status === 'upcoming';

  return (
    <div 
      onClick={onClick}
      className="glass rounded-2xl p-5 mb-4 shadow-lg border border-white/5 active:scale-[0.98] transition-all cursor-pointer group hover:border-primary/20"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors">
            {isUpcoming ? 'Sıradaki Maç' : 'Tamamlandı'}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-surface px-2 py-1 rounded-lg font-mono border border-white/5">
          {match.date}
        </span>
      </div>

      <div className="flex justify-between items-center mb-5">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white tracking-tight">Bizim Takım</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ev Sahibi</span>
        </div>
        
        {isUpcoming ? (
          <div className="bg-surface border border-white/5 px-4 py-2 rounded-xl">
            <span className="text-lg font-bold text-white font-mono">{match.time}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3 bg-surface px-3 py-1 rounded-lg border border-white/5">
            <span className="text-xl font-bold text-white">{match.score?.split('-')[0]}</span>
            <span className="text-slate-500 font-bold">:</span>
            <span className="text-xl font-bold text-white">{match.score?.split('-')[1]}</span>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="text-lg font-bold text-white text-right tracking-tight">{match.opponent || 'Rakip Aranıyor'}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Deplasman</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center text-slate-400 text-xs font-medium">
          <Icon name="location_on" size={14} className="mr-1.5 text-slate-500" />
          {match.location}
        </div>
        <div className="flex items-center text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded">
          <Icon name="payments" size={14} className="mr-1.5" />
          {match.pricePerPerson} TL
        </div>
      </div>
    </div>
  );
};