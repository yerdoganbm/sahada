
import React from 'react';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { ScreenName, Player, TeamProfile } from '../types';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  onLogout?: () => void;
  currentUser: Player;
  teamProfile?: TeamProfile | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigate, onLogout, currentUser, teamProfile }) => {
  const isPremium = currentUser.tier === 'premium' || currentUser.tier === 'partner';
  const isPartner = currentUser.tier === 'partner';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="pb-24">
      <Header 
        title="Profilim"
        onBack={onBack}
        leftAction={
          <button onClick={() => onNavigate('notifications')} className="p-2 rounded-full hover:bg-slate-800 transition-colors" aria-label="Bildirimler">
            <Icon name="notifications" className="text-slate-400" size={20} />
          </button>
        }
        rightAction={
          <button onClick={() => onNavigate('settings')} className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <Icon name="settings" size={20} />
          </button>
        }
      />
      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-4 group cursor-pointer" onClick={() => onNavigate('editProfile')}>
          <div className="absolute inset-0 bg-primary/50 blur-xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className={`w-24 h-24 rounded-full border-2 p-1 relative z-10 ${isPartner ? 'border-blue-500' : isPremium ? 'border-yellow-500' : 'border-slate-600'}`}>
            <img src={currentUser.avatar || "https://i.pravatar.cc/150?u=1"} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 bg-secondary rounded-full p-1 border border-white/10 z-20">
            <div className="bg-primary w-6 h-6 rounded-full flex items-center justify-center">
               <Icon name="edit" size={14} className="text-secondary" />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
           {currentUser.name}
           {isPremium && <Icon name="verified" className={isPartner ? "text-blue-500" : "text-yellow-500"} size={20} />}
        </h2>
        <p className="text-slate-400 mb-1 font-mono text-sm bg-surface px-3 py-1 rounded-full border border-white/5 mt-2">
          #{currentUser.position} • {isPartner ? 'Saha Partneri' : isPremium ? 'Pro Baller' : 'Starter Üye'}
        </p>
        {teamProfile && (
          <p className="text-slate-500 mb-6 text-sm flex items-center justify-center gap-1.5">
            <Icon name="groups" size={14} className="text-primary" />
            <span className="font-semibold text-white/90">{teamProfile.name}</span>
          </p>
        )}
        {!teamProfile && <div className="mb-6" />}

        {/* Upgrade Banner (Only if not Partner and not Premium) */}
        {!isPartner && !isPremium && (
           <div 
             onClick={() => onNavigate('subscription')}
             className="w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 border border-yellow-500/30 mb-6 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-transform"
           >
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-colors"></div>
              <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Icon name="workspace_premium" />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Premium'a Yükselt</h3>
                    <p className="text-[10px] text-slate-400">Detaylı istatistikler ve scouting özelliklerini aç.</p>
                 </div>
                 <Icon name="chevron_right" className="text-yellow-500" />
              </div>
           </div>
        )}

        <div className="w-full glass rounded-3xl border border-white/5 overflow-hidden mb-6">
          {/* Admin Section */}
          {isAdmin && (
            <ProfileMenuItem 
              icon="admin_panel_settings" 
              label="Grup Yönetimi (Admin)" 
              onClick={() => onNavigate('admin')}
              highlight
            />
          )}

          {/* Partner Section */}
          {isPartner && (
            <ProfileMenuItem 
              icon="store" 
              label="Saha & İşletme Yönetimi" 
              onClick={() => onNavigate('venues')}
              highlight
            />
          )}

          <ProfileMenuItem 
            icon="edit_note" 
            label="Profili Düzenle" 
            onClick={() => onNavigate('editProfile')}
          />
          
          <ProfileMenuItem 
            icon="emoji_events" 
            label="Liderlik & İstatistikler" 
            onClick={() => onNavigate('leaderboard')}
          />
          
          <ProfileMenuItem 
            icon="account_balance_wallet" 
            label="Cüzdan ve Ödemeler" 
            onClick={() => onNavigate('payments')}
          />

           <ProfileMenuItem 
            icon="card_membership" 
            label="Üyelik Paketleri" 
            onClick={() => onNavigate('subscription')}
            highlight={isPremium && !isPartner}
          />
          
          <ProfileMenuItem icon="support_agent" label="Destek" />
          
          <ProfileMenuItem 
            icon="logout" 
            label="Çıkış Yap" 
            isDanger 
            onClick={onLogout}
          />
        </div>
        
        <span className="text-[10px] text-slate-600 font-mono">v1.2.0 • Release</span>
      </div>
    </div>
  );
};

interface ProfileMenuItemProps {
  icon: string;
  label: string;
  isDanger?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

const ProfileMenuItem = ({ icon, label, isDanger = false, highlight = false, onClick }: ProfileMenuItemProps) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group ${highlight ? 'bg-primary/5' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-500/10' : highlight ? 'bg-primary/10' : 'bg-surface'}`}>
         <Icon name={icon} className={isDanger ? 'text-red-500' : highlight ? 'text-primary' : 'text-slate-400 group-hover:text-primary transition-colors'} size={18} />
      </div>
      <span className={`text-sm font-medium ${isDanger ? 'text-red-500' : highlight ? 'text-primary' : 'text-slate-300'}`}>{label}</span>
    </div>
    <Icon name="chevron_right" className="text-slate-600" size={20} />
  </button>
);
