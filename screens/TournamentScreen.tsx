
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';
import { MOCK_TOURNAMENT_TEAMS, MOCK_BRACKET } from '../constants';

interface TournamentScreenProps {
  onBack: () => void;
  currentUser: Player;
}

export const TournamentScreen: React.FC<TournamentScreenProps> = ({ onBack, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'standings' | 'bracket'>('standings');
  const isAdmin = currentUser.role === 'admin';

  // Sort teams by points
  const sortedTeams = [...MOCK_TOURNAMENT_TEAMS].sort((a, b) => b.stats.points - a.stats.points);

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="text-center">
             <h1 className="font-bold text-white text-lg">Turnuva Merkezi</h1>
             <p className="text-[10px] text-slate-400">Sonbahar Ligi 2023</p>
        </div>
        {isAdmin ? (
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 text-primary">
                <Icon name="settings" size={20} />
            </button>
        ) : <div className="w-10"></div>}
      </div>

      <div className="p-4 space-y-6">
        
        {/* Tab Switcher */}
        <div className="bg-surface p-1 rounded-xl flex border border-white/5">
             <button 
                onClick={() => setActiveTab('standings')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'standings' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
             >
                <Icon name="table_chart" size={16} /> Puan Durumu
             </button>
             <button 
                onClick={() => setActiveTab('bracket')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'bracket' ? 'bg-primary text-secondary shadow-lg' : 'text-slate-400'}`}
             >
                <Icon name="account_tree" size={16} /> Play-Off
             </button>
        </div>

        {activeTab === 'standings' ? (
           <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden animate-fade-in">
              <div className="grid grid-cols-12 gap-1 px-3 py-3 bg-secondary/50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">Takım</div>
                  <div className="col-span-1 text-center">O</div>
                  <div className="col-span-1 text-center">A</div>
                  <div className="col-span-1 text-center">Y</div>
                  <div className="col-span-1 text-center">Av</div>
                  <div className="col-span-2 text-center text-primary">P</div>
              </div>
              
              <div className="divide-y divide-white/5">
                 {sortedTeams.map((team, index) => (
                    <div key={team.id} className="grid grid-cols-12 gap-1 px-3 py-3.5 items-center hover:bg-white/5 transition-colors">
                        <div className="col-span-1 text-center">
                           <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${index < 2 ? 'bg-green-500/20 text-green-500' : 'text-slate-400'}`}>
                              {index + 1}
                           </span>
                        </div>
                        <div className="col-span-5 flex items-center gap-2">
                            <img src={team.logo} className="w-6 h-6 rounded-full bg-slate-800" />
                            <span className="text-xs font-bold text-white truncate">{team.name}</span>
                        </div>
                        <div className="col-span-1 text-center text-xs text-slate-300">{team.stats.played}</div>
                        <div className="col-span-1 text-center text-xs text-slate-400">{team.stats.gf}</div>
                        <div className="col-span-1 text-center text-xs text-slate-400">{team.stats.ga}</div>
                        <div className="col-span-1 text-center text-xs text-slate-300">{team.stats.gf - team.stats.ga}</div>
                        <div className="col-span-2 text-center text-sm font-bold text-primary">{team.stats.points}</div>
                    </div>
                 ))}
              </div>
           </div>
        ) : (
           <div className="space-y-6 animate-fade-in">
              {/* Quarter Finals */}
              <div className="space-y-3">
                 <h3 className="text-xs font-bold text-slate-500 uppercase px-2">Çeyrek Final</h3>
                 {MOCK_BRACKET.filter(m => m.round === 'quarter').map(match => (
                    <BracketMatchCard key={match.id} match={match} isAdmin={isAdmin} />
                 ))}
              </div>
              
              {/* Semi Finals */}
              <div className="space-y-3 relative">
                 <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5 -z-10"></div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase px-2">Yarı Final</h3>
                 {MOCK_BRACKET.filter(m => m.round === 'semi').map(match => (
                    <BracketMatchCard key={match.id} match={match} isAdmin={isAdmin} />
                 ))}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

interface BracketMatchCardProps {
  match: any;
  isAdmin: boolean;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({ match, isAdmin }) => (
   <div className="bg-surface rounded-xl border border-white/5 overflow-hidden relative group">
      <div className="absolute top-0 right-0 px-2 py-0.5 bg-white/5 rounded-bl-lg text-[9px] text-slate-400 font-bold">
         {match.date}
      </div>
      
      <div className="p-3 space-y-2 mt-2">
         {/* Team 1 */}
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${match.winnerId === match.team1?.id ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               <span className={`text-sm font-medium ${match.winnerId === match.team1?.id ? 'text-white' : 'text-slate-400'}`}>
                  {match.team1?.name || 'Bekleniyor...'}
               </span>
            </div>
            <div className="font-mono font-bold text-white bg-secondary px-2 rounded">
               {match.team1?.score !== undefined ? match.team1?.score : '-'}
            </div>
         </div>

         {/* Team 2 */}
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${match.winnerId === match.team2?.id ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               <span className={`text-sm font-medium ${match.winnerId === match.team2?.id ? 'text-white' : 'text-slate-400'}`}>
                  {match.team2?.name || 'Bekleniyor...'}
               </span>
            </div>
            <div className="font-mono font-bold text-white bg-secondary px-2 rounded">
               {match.team2?.score !== undefined ? match.team2?.score : '-'}
            </div>
         </div>
      </div>
      
      {isAdmin && (
         <button className="w-full py-1.5 bg-white/5 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            Skoru Düzenle
         </button>
      )}
   </div>
);
