import React, { useState } from 'react';
import { Icon } from '../components/Icon';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'month' | 'year' | 'all'>('year');

  // Mock Data mimicking the image
  const stats = {
    topScorer: {
      first: { name: 'Can Demir', goals: 32, avatar: 'https://i.pravatar.cc/150?u=2', position: 'FW' },
      second: { name: 'Hakan Yılmaz', goals: 24, avatar: 'https://i.pravatar.cc/150?u=6', position: 'MF' },
      third: { name: 'Mert Kaya', goals: 19, avatar: 'https://i.pravatar.cc/150?u=13', position: 'FW' },
    },
    assists: [
      { rank: 1, name: 'Emre Aras', count: 15, position: 'MF • ORTA SAHA', avatar: 'https://i.pravatar.cc/150?u=5' },
      { rank: 2, name: 'Burak Tan', count: 12, position: 'MF • ORTA SAHA', avatar: 'https://i.pravatar.cc/150?u=7' },
      { rank: 3, name: 'Oğuz Kağan', count: 11, position: 'DF • DEFANS', avatar: 'https://i.pravatar.cc/150?u=8' },
    ],
    mvp: [
      { rank: 1, name: 'Can Demir', count: 8, position: 'FW • FORVET', avatar: 'https://i.pravatar.cc/150?u=2' },
      { rank: 2, name: 'Hakan Yılmaz', count: 5, position: 'MF • ORTA SAHA', avatar: 'https://i.pravatar.cc/150?u=6' },
      { rank: 3, name: 'Emre Aras', count: 4, position: 'MF • ORTA SAHA', avatar: 'https://i.pravatar.cc/150?u=5' },
    ],
    matches: [
      { rank: 1, name: 'Selim Engin', count: 18, position: 'GK • KALECİ', avatar: 'https://i.pravatar.cc/150?u=4' },
      { rank: 2, name: 'Can Demir', count: 17, position: 'FW • FORVET', avatar: 'https://i.pravatar.cc/150?u=2' },
      { rank: 3, name: 'Hakan Yılmaz', count: 17, position: 'MF • ORTA SAHA', avatar: 'https://i.pravatar.cc/150?u=6' },
    ]
  };

  return (
    <div className="bg-secondary min-h-screen pb-24 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-secondary to-secondary pointer-events-none z-0"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="text-center">
            <h1 className="font-bold text-white text-lg">İstatistikler</h1>
            <p className="text-[10px] text-slate-400">Grup Geneli Performans</p>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="p-4 relative z-10 space-y-8">
        
        {/* Time Filter */}
        <div className="flex justify-end">
             <div className="bg-surface p-1 rounded-xl border border-white/5 flex">
                <button onClick={() => setFilter('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'month' ? 'bg-white text-secondary' : 'text-slate-400'}`}>Bu Ay</button>
                <button onClick={() => setFilter('year')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'year' ? 'bg-white text-secondary' : 'text-slate-400'}`}>Bu Yıl</button>
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-secondary' : 'text-slate-400'}`}>Tüm Zamanlar</button>
             </div>
        </div>

        {/* Podium Section (Top Scorer) */}
        <div className="flex flex-col items-center">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary/20">
                Zirvedekiler
            </div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Icon name="emoji_events" className="text-yellow-500" /> Gol Krallığı <Icon name="emoji_events" className="text-yellow-500" />
            </h2>

            <div className="flex items-end justify-center w-full max-w-sm gap-2 mb-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center mb-4">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-300 p-1 bg-surface relative">
                        <img src={stats.topScorer.second.avatar} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center border-2 border-secondary">2</div>
                    </div>
                    <h3 className="text-white font-bold text-sm mt-4 text-center leading-tight">{stats.topScorer.second.name}</h3>
                    <span className="text-[10px] text-slate-400 bg-surface px-2 py-0.5 rounded mt-1">{stats.topScorer.second.position}</span>
                    <div className="bg-white rounded-t-2xl w-full h-16 mt-2 shadow-lg flex items-center justify-center flex-col pt-2 border-t border-slate-300">
                        <span className="text-2xl font-bold text-slate-800">{stats.topScorer.second.goals}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">GOL</span>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center z-10 -mx-2">
                    <Icon name="stars" className="text-yellow-400 mb-1 animate-bounce" />
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1 bg-surface relative shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        <img src={stats.topScorer.first.avatar} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 font-bold text-sm flex items-center justify-center border-2 border-secondary">1</div>
                    </div>
                    <h3 className="text-white font-bold text-lg mt-4 text-center leading-tight">{stats.topScorer.first.name}</h3>
                    <span className="text-[10px] text-slate-900 bg-green-400 px-2 py-0.5 rounded mt-1 font-bold">{stats.topScorer.first.position}</span>
                    
                    <div className="bg-white rounded-xl w-[140px] p-4 mt-3 shadow-2xl flex flex-col items-center justify-center transform scale-110 border-2 border-yellow-400 relative">
                        <span className="text-5xl font-black text-slate-900">{stats.topScorer.first.goals}</span>
                        <span className="text-xs text-yellow-600 font-bold uppercase tracking-widest">GOL</span>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center mb-2">
                    <div className="w-16 h-16 rounded-full border-4 border-orange-700 p-1 bg-surface relative">
                        <img src={stats.topScorer.third.avatar} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-orange-700 text-white font-bold text-xs flex items-center justify-center border-2 border-secondary">3</div>
                    </div>
                    <h3 className="text-white font-bold text-xs mt-4 text-center leading-tight">{stats.topScorer.third.name}</h3>
                    <span className="text-[10px] text-slate-400 bg-surface px-2 py-0.5 rounded mt-1">{stats.topScorer.third.position}</span>
                    <div className="bg-white rounded-t-2xl w-full h-12 mt-2 shadow-lg flex items-center justify-center flex-col pt-2 border-t border-orange-700">
                        <span className="text-xl font-bold text-slate-800">{stats.topScorer.third.goals}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">GOL</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Assist Leader */}
            <StatCard 
                title="Asist Krallığı" 
                icon="assistant" 
                accentColor="text-green-400" 
                data={stats.assists} 
            />

            {/* MVP Count */}
            <StatCard 
                title="MVP Sayısı" 
                icon="military_tech" 
                accentColor="text-yellow-400" 
                data={stats.mvp} 
            />

            {/* Match Count */}
            <StatCard 
                title="Maç Sayısı" 
                icon="sports_soccer" 
                accentColor="text-blue-400" 
                data={stats.matches} 
                label="Devamlılık"
            />

        </div>

      </div>

      {/* Floating Share Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg shadow-green-900/50 flex items-center justify-center text-secondary hover:scale-105 transition-transform z-50">
          <Icon name="share" />
      </button>

    </div>
  );
};

const StatCard = ({ title, icon, accentColor, data, label }: any) => (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
                <Icon name={icon} className={accentColor} />
                <h3 className="text-slate-900 font-bold">{title}</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label || 'TOP 10'}</span>
        </div>
        
        <div className="space-y-3">
            {data.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-bold font-mono text-sm w-4">{item.rank}</span>
                        <img src={item.avatar} className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                            <h4 className="text-slate-900 font-bold text-sm leading-tight">{item.name}</h4>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">{item.position}</span>
                        </div>
                    </div>
                    <span className={`text-lg font-bold font-mono ${i===0 ? accentColor : 'text-slate-800'}`}>{item.count}</span>
                </div>
            ))}
        </div>
        
        <button className="w-full mt-4 text-xs font-bold text-green-600 hover:text-green-700 py-2">
            Tümünü Gör
        </button>
    </div>
);