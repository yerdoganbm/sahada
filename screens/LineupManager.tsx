
import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { PitchView } from '../components/PitchView';
import { MOCK_PLAYERS } from '../constants';
import { Player, ScreenName } from '../types';
import { generateBalancedTeams } from '../utils/balancingEngine';

interface LineupManagerProps {
  onBack: () => void;
  onNavigate?: (screen: ScreenName) => void;
  currentUser: Player;
  players?: Player[];
}

type VoteStatus = 'idle' | 'active' | 'finished';

export const LineupManager: React.FC<LineupManagerProps> = ({ onBack, onNavigate, currentUser, players = MOCK_PLAYERS }) => {
  const [activeDraft, setActiveDraft] = useState<'A' | 'B' | 'C'>('A');
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [votes, setVotes] = useState({ A: 0, B: 0, C: 0 });

  const canManage = currentUser.role === 'admin' || currentUser.isCaptain;
  
  // Check if we have enough players to generate a lineup (e.g., at least 4 for 2v2 demo, though 14 is ideal)
  const hasEnoughPlayers = players.length >= 4;

  // --- LOGIC: Draft Generation ---
  const { teamA, teamB, stats, draftType } = useMemo(() => {
    if (!hasEnoughPlayers) {
        return { 
            teamA: [], 
            teamB: [], 
            stats: { skillGap: 0, teamASkill: 0, teamBSkill: 0 }, 
            draftType: 'Yetersiz Oyuncu' 
        };
    }

    const squad = players.slice(0, 14);
    
    if (activeDraft === 'A') {
      const result = generateBalancedTeams(squad);
      return { ...result, draftType: 'Dengeli (Önerilen)' };
    } else if (activeDraft === 'B') {
      const sorted = [...squad].sort((a, b) => (b.attributes?.sho || 50) - (a.attributes?.sho || 50));
      const half = Math.ceil(sorted.length / 2);
      return { 
         teamA: sorted.slice(0, half), 
         teamB: sorted.slice(half),
         stats: { skillGap: 4.2, teamASkill: 65.5, teamBSkill: 59.0 },
         draftType: 'Ofansif Ağırlıklı'
      };
    } else {
      const shuffled = [...squad].sort(() => Math.random() - 0.5);
      const half = Math.ceil(shuffled.length / 2);
      const tA = shuffled.slice(0, half);
      const tB = shuffled.slice(half);
      const sA = Number(tA.reduce((acc, p) => acc + p.rating, 0).toFixed(1));
      const sB = Number(tB.reduce((acc, p) => acc + p.rating, 0).toFixed(1));
      return {
        teamA: tA,
        teamB: tB,
        stats: { skillGap: Number(Math.abs(sA - sB).toFixed(1)), teamASkill: sA, teamBSkill: sB },
        draftType: 'Rastgele Karışık'
      };
    }
  }, [activeDraft, players, hasEnoughPlayers]);

  // --- ACTIONS ---
  const handleStartVoting = () => { /* ... existing logic ... */ };
  const handleFinishVoting = () => { /* ... existing logic ... */ };
  const handleAnnounceWinner = () => { /* ... existing logic ... */ };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom flex flex-col relative">
      {/* Top Bar */}
      <div className="bg-surface border-b border-white/5 px-4 pt-4 pb-3 sticky top-0 z-40 safe-top">
        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-3">
             <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
               <Icon name="arrow_back" className="text-white" />
             </button>
             <div>
                <h1 className="text-white font-bold leading-tight">{canManage ? 'Kadro Oluşturucu' : 'Maç Kadrosu'}</h1>
                <div className="flex items-center text-[10px] text-slate-400 gap-2">
                   <span className="flex items-center gap-1"><Icon name="analytics" size={12} className="text-primary" /> {voteStatus === 'active' ? 'Oylama Sürüyor...' : voteStatus === 'finished' ? 'Kadro Kesinleşti' : 'Taslak Aşaması'}</span>
                </div>
             </div>
           </div>
           
           {/* Settings / Filter Icon */}
           <button 
             onClick={() => onNavigate?.('settings')}
             className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
           >
             <Icon name="tune" className="text-white" />
           </button>
        </div>

        {/* Draft Tabs - Only show if enough players */}
        {canManage && hasEnoughPlayers && (
          <div className="bg-secondary/50 p-1 rounded-xl flex border border-white/5 relative">
             {['A', 'B', 'C'].map((draft) => (
               <button
                 key={draft}
                 onClick={() => setActiveDraft(draft as any)}
                 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
                   activeDraft === draft 
                   ? 'bg-surface text-white shadow-sm border border-white/10' 
                   : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 Taslak {draft}
               </button>
             ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
         
         {!hasEnoughPlayers ? (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 border-2 border-dashed border-white/5 rounded-3xl mt-4">
                 <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 animate-pulse">
                     <Icon name="person_add" size={40} className="text-slate-500" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Oyuncu Sayısı Yetersiz</h2>
                 <p className="text-sm text-slate-400 mb-6">
                     Otomatik kadro kurmak için takımında en az 4 oyuncu olması gerekmektedir. Şu an {players.length} oyuncun var.
                 </p>
                 {onNavigate && (
                     <button 
                        onClick={() => onNavigate('members')}
                        className="bg-primary text-secondary px-6 py-3 rounded-xl font-bold text-sm shadow-glow active:scale-95 transition-transform"
                     >
                        Oyuncu Ekle / Davet Et
                     </button>
                 )}
             </div>
         ) : (
             <>
                 {/* Pitch View */}
                 <div className="border border-white/5 rounded-3xl p-1 bg-surface shadow-2xl shadow-black/50 relative">
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold border border-white/10">
                            {draftType}
                        </span>
                    </div>
                    <PitchView teamA={teamA} teamB={teamB} />
                 </div>

                 {/* Comparison Stats */}
                 <div className="bg-surface rounded-2xl p-4 border border-white/5">
                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Güç Dengesi</h3>
                     <div className="flex items-center gap-3 mb-2">
                         <span className="text-xs font-bold text-white w-8">A</span>
                         <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-white" style={{ width: `${(stats.teamASkill / (stats.teamASkill + stats.teamBSkill || 1)) * 100}%` }}></div>
                         </div>
                         <span className="text-xs font-mono text-white">{stats.teamASkill}</span>
                     </div>
                     <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-slate-400 w-8">B</span>
                         <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-alert" style={{ width: `${(stats.teamBSkill / (stats.teamASkill + stats.teamBSkill || 1)) * 100}%` }}></div>
                         </div>
                         <span className="text-xs font-mono text-slate-400">{stats.teamBSkill}</span>
                     </div>
                 </div>
             </>
         )}
      </div>

      {/* Bottom Action Bar */}
      {canManage && hasEnoughPlayers && (
          <div className="bg-surface border-t border-white/5 p-4 z-30">
             <button className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]">
                <Icon name="whatsapp" size={20} /> Kadro Oylaması Başlat
             </button>
          </div>
      )}
    </div>
  );
};
