
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName, Player, RsvpStatus, TransferRequest, Match, TeamProfile } from '../types';

interface DashboardProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
  currentUser: Player;
  rsvpStatus: RsvpStatus;
  onRsvpChange: (status: RsvpStatus) => void;
  transferRequests?: TransferRequest[];
  allMatches?: Match[];
  allPlayers?: Player[];
  teamProfile?: TeamProfile | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onNavigate, 
    currentUser, 
    rsvpStatus, 
    onRsvpChange, 
    transferRequests = [],
    allMatches = [],
    allPlayers = [],
    teamProfile
}) => {
  const [hasNotification, setHasNotification] = useState(true);
  
  // Logic for empty state
  const hasMatches = allMatches.length > 0;
  const nextMatch = allMatches.find(m => m.status === 'upcoming') || allMatches[0];
  
  const baseJoined = 11;
  const joinedCount = rsvpStatus === 'yes' ? baseJoined + 1 : baseJoined;
  const totalSlots = 14;
  const percentage = Math.min((joinedCount / totalSlots) * 100, 100);

  const isAdmin = currentUser.role === 'admin';
  const isPartner = currentUser.tier === 'partner';
  const isCaptain = currentUser.isCaptain;

  // Pending Approvals for Captain
  const pendingApprovals = transferRequests.filter(tr => tr.status === 'pending_captain');

  // Helper for tier display
  const getTierInfo = () => {
    switch (currentUser.tier) {
      case 'partner':
        return { label: 'Saha Partner', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'premium':
        return { label: 'Pro Baller', color: 'text-amber-500 bg-amber-50 border-amber-200' };
      default:
        return { label: 'Starter Üye', color: 'text-slate-400 bg-slate-50 border-slate-100' };
    }
  };

  const tierInfo = getTierInfo();

  return (
    <div className="pb-24 bg-white min-h-screen text-slate-800">
      
      {/* Header Profile Section */}
      <div className="px-6 pt-8 pb-4 flex justify-between items-center bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => onNavigate('profile')}>
             <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
             </div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div onClick={() => onNavigate('profile')} className="cursor-pointer">
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {currentUser.name}
            </h1>
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${tierInfo.color}`}>
              {currentUser.isCaptain && <span className="mr-1 text-yellow-600">©️</span>}
              {tierInfo.label.toUpperCase()}
            </div>
          </div>
        </div>
        <button 
            onClick={() => onNavigate('notifications')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all relative ${hasNotification ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-transparent border-transparent text-slate-300'}`}
        >
           <Icon name={hasNotification ? "notifications_active" : "notifications_off"} size={20} />
           {hasNotification && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
        </button>
      </div>

      <div className="px-6 space-y-6">
        
        {/* TEAM NAME BANNER (New) */}
        {teamProfile && (
             <div className="text-center py-2">
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter" style={{ color: teamProfile.colors[0] }}>
                     {teamProfile.name}
                 </h2>
                 <p className="text-[10px] text-slate-400 font-bold tracking-widest">{allPlayers.length} OYUNCU</p>
             </div>
        )}

        {/* Main Match Card OR Empty State */}
        {hasMatches ? (
            <div 
                onClick={() => onNavigate('matchDetails', { id: nextMatch.id })}
                className="w-full aspect-[4/3] rounded-[32px] relative overflow-hidden shadow-2xl shadow-teal-900/20 cursor-pointer active:scale-[0.98] transition-transform group"
            >
                {/* Map Background Image */}
                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/29.0,41.0,13.5,0/600x400?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2xsN3F3OG0wMDc2MnB0Ynh5cm15ZnVyIn0.7j_k9lQ6y0d3y0q0f0g0g0')] bg-cover bg-center opacity-60 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-teal-900/80 via-teal-900/40 to-teal-950/90"></div>

                <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-900/20">
                        BUGÜN
                    </span>
                </div>

                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                    <Icon name="ios_share" size={16} />
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Bu Akşam {nextMatch.time}</h2>
                    <div className="flex items-center gap-1.5 text-slate-200">
                        <Icon name="location_on" size={16} className="text-primary" />
                        <span className="font-medium text-sm">{nextMatch.location}</span>
                    </div>
                </div>
                
                <div className="absolute bottom-6 right-6 text-white text-right">
                    <div className="flex items-center justify-end gap-1 font-bold bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <Icon name="cloud" size={14} /> 18°C
                    </div>
                </div>
            </div>
        ) : (
            <div className="w-full aspect-[4/3] rounded-[32px] bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-700 group">
                {isAdmin ? (
                    <button 
                        onClick={() => onNavigate('matchCreate')}
                        className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform"
                    >
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary animate-pulse">
                            <Icon name="add" size={40} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">İlk Maçını Planla</h2>
                            <p className="text-sm text-slate-400">Takımın hazır, sahayı ayarla!</p>
                        </div>
                    </button>
                ) : (
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <Icon name="event_busy" size={32} className="text-slate-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white mb-1">Henüz Maç Yok</h2>
                            <p className="text-xs text-slate-400">Kaptanın maç oluşturması bekleniyor.</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Pending Approvals (For Captain) */}
        {isCaptain && pendingApprovals.length > 0 && (
            <div 
              onClick={() => onNavigate('polls')}
              className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-600">
                        <Icon name="gavel" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Transfer Onayı Bekliyor</h3>
                        <p className="text-[10px] text-slate-500">{pendingApprovals.length} oyuncu önerildi</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400">
                    <Icon name="chevron_right" />
                </div>
            </div>
        )}

        {/* Quick Actions */}
        <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Hızlı İşlemler</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                {isAdmin && (
                    <>
                        <QuickAction icon="admin_panel_settings" label="Yönetim" color="bg-slate-800 text-white" onClick={() => onNavigate('admin')} />
                        <QuickAction icon="person_add" label="Üyeler" color="bg-blue-50 text-blue-600" onClick={() => onNavigate('members')} />
                        <QuickAction icon="groups" label="Kadro" color="bg-emerald-50 text-emerald-600" onClick={() => onNavigate('team')} />
                        <QuickAction icon="poll" label="Anketler" color="bg-orange-50 text-orange-500" onClick={() => onNavigate('polls')} />
                    </>
                )}
                
                {!isAdmin && (
                    <>
                        <QuickAction icon="emoji_events" label="Turnuvalar" color="bg-yellow-50 text-yellow-600" onClick={() => onNavigate('tournament')} />
                        <QuickAction icon="groups" label="Kadro" color="bg-emerald-50 text-emerald-600" onClick={() => onNavigate('team')} />
                        <QuickAction icon="payments" label="Cüzdan" color="bg-blue-50 text-blue-500" onClick={() => onNavigate('payments')} />
                        <QuickAction icon="poll" label="Anketler" color="bg-orange-50 text-orange-500" onClick={() => onNavigate('polls')} />
                    </>
                )}
            </div>
        </div>

        {/* Match Prep Progress (Consistent UI) */}
        {!isPartner && hasMatches && (
            <div className="bg-slate-50 rounded-[28px] p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-center mb-3 relative z-10">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Icon name="fitness_center" size={16} className="text-slate-400" />
                        Maç Hazırlığı
                    </span>
                    <span className={`font-bold text-xs ${joinedCount >= totalSlots ? 'text-green-600' : 'text-primary'}`}>
                        {joinedCount}/{totalSlots} Hazır
                    </span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-5 border border-slate-300/50">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-glow" style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex -space-x-2">
                        {allPlayers.slice(0, 3).map(p => (
                            <img key={p.id} src={p.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onRsvpChange('yes')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${rsvpStatus === 'yes' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <Icon name="check" size={16} />
                        </button>
                        <button onClick={() => onRsvpChange('no')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${rsvpStatus === 'no' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label, color, onClick }: { icon: string, label: string, color: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform min-w-[72px] snap-center">
        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm ${color} transition-all group-hover:scale-105`}>
            <Icon name={icon} size={26} />
        </div>
        <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </button>
);
