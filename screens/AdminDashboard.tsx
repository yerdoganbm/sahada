
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName, Player, JoinRequest, Match, Payment } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
  joinRequests?: JoinRequest[];
  matches?: Match[];
  payments?: Payment[];
  players?: Player[];
  onStartTrial?: (playerId: string) => void;
  onFinalDecision?: (playerId: string, decision: 'promote' | 'reject') => void;
  onApproveRequest?: (req: JoinRequest) => void;
  onRejectRequest?: (reqId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    onBack, 
    onNavigate, 
    currentUser, 
    joinRequests = [],
    matches = [],
    payments = [],
    players = [],
    onStartTrial,
    onFinalDecision,
    onApproveRequest,
    onRejectRequest
}) => {
  // Dynamic Stats Calculation (No Mocks)
  const stats = useMemo(() => {
     const upcomingMatches = matches.filter(m => m.status === 'upcoming').length;
     const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
     const totalMembers = players.filter(p => p.role === 'member' || p.role === 'admin').length;
     
     // Scouting Stats
     const pendingApprovalCandidates = players.filter(p => p.role === 'guest' && p.trialStatus === 'pending_approval').length;
     const inTrialPlayers = players.filter(p => p.role === 'guest' && p.trialStatus === 'in_trial').length;
     
     // Debug logging
     console.log('📊 AdminDashboard Stats:', {
       totalPlayers: players.length,
       guestPlayers: players.filter(p => p.role === 'guest').length,
       pendingApprovalCandidates,
       inTrialPlayers
     });
     console.log('🔍 Guest Players:', players.filter(p => p.role === 'guest'));
     
     return { upcomingMatches, pendingPayments, totalMembers, pendingApprovalCandidates, inTrialPlayers };
  }, [matches, payments, players]);

  if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
      return (
          <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                  <Icon name="lock" size={40} className="text-alert" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Erişim Reddedildi</h2>
              <p className="text-slate-400 text-sm mb-6">Bu sayfayı görüntülemek için yönetici yetkisine sahip olmanız gerekmektedir.</p>
              <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold">
                  Geri Dön
              </button>
          </div>
      );
  }

  return (
    <div className="pb-32 bg-secondary min-h-screen">
      <div className="sticky top-0 z-40 bg-secondary/90 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Icon name="admin_panel_settings" className="text-primary" size={20} />
          <span className="font-bold text-white text-lg">Yönetim Paneli</span>
        </div>
        <button 
          onClick={() => onNavigate('matchCreate')}
          className="bg-primary text-secondary text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Icon name="bolt" size={14} />
          Hızlı Maç
        </button>
      </div>

      <div className="p-4 space-y-8">
        {/* Summary Stats */}
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Grubun Özeti</h3>
          <div className="grid grid-cols-3 gap-3">
             <StatCard label="Aktif Maçlar" value={stats.upcomingMatches} sub="Adet" color="text-white" icon="sports_soccer" />
             <StatCard label="Ödeme Bekleyen" value={stats.pendingPayments} sub="TL" color="text-alert" icon="pending" />
             <StatCard label="Üye Sayısı" value={stats.totalMembers} sub="Oyuncu" color="text-blue-400" icon="groups" />
          </div>
        </div>

        {/* WhatsApp & Automation Center (NEW) */}
        <div 
          onClick={() => onNavigate('whatsappCenter')}
          className="bg-gradient-to-r from-[#075E54] to-[#128C7E] rounded-2xl p-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-green-900/20"
        >
           <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 flex justify-between items-center">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Icon name="smart_toy" className="text-white" size={20} />
                    <h3 className="font-bold text-white text-lg">WhatsApp Botu</h3>
                 </div>
                 <p className="text-green-100 text-xs">Otomatik hatırlatmalar, yoklama ve duyurular</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                 <Icon name="chevron_right" className="text-white" />
              </div>
           </div>
        </div>

        {/* Quick Actions */}
        <div className="relative z-10">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Hızlı Aksiyonlar</h3>
           <div className="grid grid-cols-2 gap-3">
              <AdminActionBtn 
                icon="account_balance_wallet" 
                title="Finansal Raporlar" 
                subtitle="Gelir & Gider" 
                onClick={() => onNavigate('financialReports')} 
              />
              <AdminActionBtn 
                icon="groups" 
                title="Üye Yönetimi" 
                subtitle="Katılım & Roller" 
                onClick={() => onNavigate('members')} 
              />
              <AdminActionBtn 
                icon="calendar_month" 
                title="Maç Planla" 
                subtitle="Sihirbaz ile kur" 
                onClick={() => onNavigate('matchCreate')} 
              />
              <AdminActionBtn 
                icon="shuffle" 
                title="Kadro Oluştur" 
                subtitle="A/B/C Taslaklar" 
                onClick={() => onNavigate('lineupManager')} 
              />
           </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5 relative z-10">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Bekleyen İşlemler</h3>
              <span className="bg-alert/20 text-alert text-[10px] font-bold px-2 py-0.5 rounded">{joinRequests.length > 0 ? `${joinRequests.length} Yeni` : '0 Yeni'}</span>
           </div>
           
           <div className="space-y-3">
              {joinRequests.length > 0 ? (
                joinRequests.map(req => (
                  <div key={req.id} className="bg-secondary rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={req.avatar} className="w-10 h-10 rounded-full border border-blue-500/30" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{req.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {req.position === 'GK' ? 'Kaleci' : req.position} • {req.phone}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
                        KATILIM
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onRejectRequest && onRejectRequest(req.id)}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"
                      >
                        Reddet
                      </button>
                      <button 
                        onClick={() => onApproveRequest && onApproveRequest(req)}
                        className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold"
                      >
                        Onayla
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 opacity-50">
                    <Icon name="check_circle" size={24} className="text-slate-600 mb-2 mx-auto" />
                    <p className="text-xs text-slate-400">Bekleyen işlem bulunmuyor.</p>
                </div>
              )}
           </div>
        </div>

        {/* ADAY HAVUZU (SCOUTING & TRIAL) - YENİ BÖLÜM */}
        {(stats.pendingApprovalCandidates > 0 || stats.inTrialPlayers > 0) && (
          <div className="bg-surface rounded-2xl p-4 border border-primary/20 relative z-10">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <Icon name="person_search" size={18} />
                Aday Havuzu
              </h3>
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                {stats.pendingApprovalCandidates + stats.inTrialPlayers} Aday
              </span>
           </div>
           
           <div className="space-y-3">
              {/* Pending Approval Candidates */}
              {players.filter(p => p.role === 'guest' && p.trialStatus === 'pending_approval').map(candidate => {
                const referrer = players.find(p => p.id === candidate.referredBy);
                return (
                  <div key={candidate.id} className="bg-secondary rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={candidate.avatar} className="w-10 h-10 rounded-full border border-yellow-500/30" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{candidate.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {candidate.position} • Öneren: {referrer?.name || 'Bilinmiyor'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                        ONAY BEKLİYOR
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onFinalDecision && onFinalDecision(candidate.id, 'reject')}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"
                      >
                        Reddet
                      </button>
                      <button 
                        onClick={() => onStartTrial && onStartTrial(candidate.id)}
                        className="flex-1 py-2 rounded-lg bg-primary text-secondary text-xs font-bold"
                      >
                        Deneme Başlat
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* In Trial Players */}
              {players.filter(p => p.role === 'guest' && p.trialStatus === 'in_trial').map(trialPlayer => {
                const referrer = players.find(p => p.id === trialPlayer.referredBy);
                return (
                  <div key={trialPlayer.id} className="bg-secondary rounded-xl p-3 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={trialPlayer.avatar} className="w-10 h-10 rounded-full border border-primary/50" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{trialPlayer.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {trialPlayer.position} • Öneren: {referrer?.name || 'Bilinmiyor'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                        DENEME
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onFinalDecision && onFinalDecision(trialPlayer.id, 'reject')}
                        className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20"
                      >
                        Eleme
                      </button>
                      <button 
                        onClick={() => onFinalDecision && onFinalDecision(trialPlayer.id, 'promote')}
                        className="flex-1 py-2 rounded-lg bg-green-500 text-white text-xs font-bold"
                      >
                        Asil Üye Yap
                      </button>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, color, icon }: any) => (
  <div className="bg-surface rounded-2xl p-3 border border-white/5 flex flex-col justify-between min-h-[112px] relative overflow-hidden group">
     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon name={icon} size={40} />
     </div>
     <span className="text-[10px] text-slate-400 font-bold uppercase relative z-10">{label}</span>
     <div className="relative z-10">
        <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
        <div className="text-[10px] text-slate-500">{sub}</div>
     </div>
  </div>
);

const AdminActionBtn = ({ icon, title, subtitle, onClick }: any) => (
  <button onClick={onClick} className="bg-surface hover:bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-start text-left transition-colors group active:scale-[0.98]">
     <div className="bg-slate-800 p-2 rounded-lg mb-2 group-hover:bg-primary group-hover:text-secondary transition-colors">
        <Icon name={icon} size={20} className="text-slate-300 group-hover:text-secondary" />
     </div>
     <span className="text-sm font-bold text-white mb-0.5">{title}</span>
     <span className="text-[10px] text-slate-500">{subtitle}</span>
  </button>
);

const PendingRow = ({ icon, title, desc, time, isAlert, onClick }: any) => (
   <div onClick={onClick} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 active:scale-[0.99]">
      <div className="flex items-center gap-3">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAlert ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            <Icon name={icon} size={16} />
         </div>
         <div>
            <h4 className="text-xs font-bold text-white">{title}</h4>
            <p className="text-[10px] text-slate-400">{desc}</p>
         </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[9px] text-slate-600 mb-1">{time}</span>
        <Icon name="chevron_right" className="text-slate-600" size={16} />
      </div>
   </div>
);
