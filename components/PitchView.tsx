import React from 'react';
import { Player } from '../types';

interface PitchViewProps {
  teamA: Player[];
  teamB: Player[];
}

export const PitchView: React.FC<PitchViewProps> = ({ teamA, teamB }) => {
  // Simple formation mapping for 7v7 (1 GK, 2 DEF, 3 MID, 1 FWD)
  const getPositionStyle = (index: number, team: 'A' | 'B') => {
    const isA = team === 'A';
    // Positions relative to team side
    // GK
    if (index === 0) return isA ? { bottom: '5%', left: '45%' } : { top: '5%', left: '45%' };
    // DEF
    if (index === 1) return isA ? { bottom: '20%', left: '20%' } : { top: '20%', right: '20%' };
    if (index === 2) return isA ? { bottom: '20%', right: '20%' } : { top: '20%', left: '20%' };
    // MID
    if (index === 3) return isA ? { bottom: '40%', left: '15%' } : { top: '40%', right: '15%' };
    if (index === 4) return isA ? { bottom: '40%', right: '15%' } : { top: '40%', left: '15%' };
    if (index === 5) return isA ? { bottom: '35%', left: '45%' } : { top: '35%', left: '45%' }; // CM
    // FWD
    if (index === 6) return isA ? { bottom: '55%', left: '45%' } : { top: '55%', left: '45%' };
    
    // Fallback for extras
    return { display: 'none' }; 
  };

  return (
    <div className="w-full aspect-[2/3] bg-[#052e16] rounded-2xl relative overflow-hidden shadow-inner border border-white/10 mt-4">
      {/* Pitch Markings */}
      <div className="absolute inset-4 border-2 border-white/20 rounded-lg"></div>
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20 hidden"></div>
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/20"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full"></div>
      
      {/* Goals */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-x border-b border-white/30 rounded-b bg-white/5"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-x border-t border-white/30 rounded-t bg-white/5"></div>

      {/* Team A (Bottom) */}
      {teamA.map((p, i) => (
        <div key={p.id} className="absolute flex flex-col items-center w-10 z-10" style={getPositionStyle(i, 'A')}>
          <div className="w-8 h-8 rounded-full border-2 border-primary bg-secondary shadow-lg overflow-hidden">
             <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] text-white font-medium bg-secondary/80 px-1 rounded mt-1 whitespace-nowrap overflow-hidden max-w-[60px] text-ellipsis backdrop-blur-sm">
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}

      {/* Team B (Top) */}
      {teamB.map((p, i) => (
        <div key={p.id} className="absolute flex flex-col items-center w-10 z-10" style={getPositionStyle(i, 'B')}>
          <div className="w-8 h-8 rounded-full border-2 border-alert bg-secondary shadow-lg overflow-hidden">
             <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[9px] text-white font-medium bg-secondary/80 px-1 rounded mt-1 whitespace-nowrap overflow-hidden max-w-[60px] text-ellipsis backdrop-blur-sm">
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
      
      {/* VS Badge */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white/50 tracking-widest z-0">
        VS
      </div>
    </div>
  );
};