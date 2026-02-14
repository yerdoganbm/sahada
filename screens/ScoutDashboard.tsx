import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player, TalentPoolPlayer, ScoutReport, ScreenName } from '../types';

interface ScoutDashboardProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName, id?: string) => void;
  currentUser: Player;
  talentPool: TalentPoolPlayer[];
  players: Player[];
}

export const ScoutDashboard: React.FC<ScoutDashboardProps> = ({
  onBack,
  onNavigate,
  currentUser,
  talentPool,
  players
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'active' | 'reports'>('overview');

  // Calculate statistics
  const stats = {
    totalScouts: talentPool.length,
    activeTrial: talentPool.filter(p => p.status === 'in_trial').length,
    pendingReview: talentPool.filter(p => p.status === 'scouting').length,
    signed: talentPool.filter(p => p.status === 'signed').length,
    rejected: talentPool.filter(p => p.status === 'rejected').length
  };

  // Recent reports (mock for now - would come from props in real implementation)
  const recentReports = talentPool
    .filter(p => p.scoutReports && p.scoutReports.length > 0)
    .slice(0, 5)
    .map(p => ({
      ...p.scoutReports[p.scoutReports.length - 1],
      playerName: p.name
    }));

  // Active trials
  const activeTrials = talentPool.filter(p => p.status === 'in_trial');

  // Pending decisions
  const pendingDecisions = talentPool.filter(p => 
    p.status === 'in_trial' && 
    p.trialMatchesPlayed >= p.trialMatchesTotal &&
    !p.finalDecision
  );

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sign_now': return 'text-green-400 bg-green-500/10';
      case 'extend_trial': return 'text-yellow-400 bg-yellow-500/10';
      case 'watch_more': return 'text-blue-400 bg-blue-500/10';
      case 'reject': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'sign_now': return 'İmzala';
      case 'extend_trial': return 'Süre Uzat';
      case 'watch_more': return 'İzle';
      case 'reject': return 'Reddet';
      default: return rec;
    }
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="bg-surface border-b border-white/5 px-4 pt-4 pb-3 sticky top-0 z-40 safe-top">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
            >
              <Icon name="arrow_back" className="text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold leading-tight">Scout Merkezi</h1>
              <p className="text-[10px] text-slate-400">Yetenek Keşif & Değerlendirme</p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('talentPool')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 active:scale-95 transition-transform"
          >
            <Icon name="person_search" className="text-primary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'Genel', icon: 'dashboard' },
            { id: 'active', label: 'Aktif', icon: 'sports_soccer' },
            { id: 'reports', label: 'Raporlar', icon: 'description' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedTab === tab.id
                  ? 'bg-primary text-secondary shadow-glow'
                  : 'bg-surface text-slate-400 border border-white/5'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {selectedTab === 'overview' && (
          <>
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="person_search" className="text-primary" size={24} />
                  <span className="text-2xl font-black text-white">{stats.totalScouts}</span>
                </div>
                <p className="text-xs text-slate-400">Toplam Aday</p>
              </div>

              <div className="bg-surface border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="sports_soccer" className="text-yellow-400" size={24} />
                  <span className="text-2xl font-black text-white">{stats.activeTrial}</span>
                </div>
                <p className="text-xs text-slate-400">Deneme Sürecinde</p>
              </div>

              <div className="bg-surface border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="pending" className="text-blue-400" size={24} />
                  <span className="text-2xl font-black text-white">{stats.pendingReview}</span>
                </div>
                <p className="text-xs text-slate-400">İnceleme Bekliyor</p>
              </div>

              <div className="bg-surface border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="check_circle" className="text-green-400" size={24} />
                  <span className="text-2xl font-black text-white">{stats.signed}</span>
                </div>
                <p className="text-xs text-slate-400">İmzalandı</p>
              </div>
            </div>

            {/* Pending Decisions */}
            {pendingDecisions.length > 0 && (
              <div className="bg-alert/10 border border-alert/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="notification_important" className="text-alert" size={20} />
                  <h3 className="text-sm font-bold text-white">Karar Bekleyen Adaylar</h3>
                  <span className="ml-auto bg-alert text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pendingDecisions.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingDecisions.slice(0, 3).map((player) => (
                    <div key={player.id} className="bg-surface/50 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-white">{player.name}</p>
                          <p className="text-xs text-slate-400">{player.trialMatchesPlayed} maç tamamlandı</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('talentPool', player.id)}
                        className="bg-primary text-secondary px-3 py-1 rounded-lg text-xs font-bold"
                      >
                        Karar Ver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Hızlı Aksiyonlar</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('talentPool')}
                  className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-left active:scale-95 transition-transform"
                >
                  <Icon name="person_add" className="text-primary mb-2" size={24} />
                  <p className="text-xs font-bold text-white">Yeni Aday Ekle</p>
                </button>

                <button
                  onClick={() => onNavigate('scoutReports')}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-left active:scale-95 transition-transform"
                >
                  <Icon name="add_circle" className="text-blue-400 mb-2" size={24} />
                  <p className="text-xs font-bold text-white">Rapor Oluştur</p>
                </button>

                <button
                  onClick={() => onNavigate('members')}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-left active:scale-95 transition-transform"
                >
                  <Icon name="groups" className="text-green-400 mb-2" size={24} />
                  <p className="text-xs font-bold text-white">Mevcut Kadro</p>
                </button>

                <button
                  className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-left active:scale-95 transition-transform"
                >
                  <Icon name="analytics" className="text-purple-400 mb-2" size={24} />
                  <p className="text-xs font-bold text-white">Analitik</p>
                </button>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'active' && (
          <>
            {/* Active Trials */}
            <div className="space-y-3">
              {activeTrials.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center">
                  <Icon name="sports_soccer" className="text-slate-600 mx-auto mb-3" size={48} />
                  <p className="text-sm text-slate-400">Şu anda deneme sürecinde aday yok</p>
                </div>
              ) : (
                activeTrials.map((player) => (
                  <div key={player.id} className="bg-surface border border-white/5 rounded-2xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{player.name}</h3>
                          <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400 font-bold">
                            Deneme
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{player.position} • {player.age} yaş</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Icon name="event" size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-400">
                              {player.trialMatchesPlayed}/{player.trialMatchesTotal} maç
                            </span>
                          </div>
                          {player.averageScore && (
                            <div className="flex items-center gap-1">
                              <Icon name="star" size={14} className="text-primary" />
                              <span className="text-xs text-white font-bold">{player.averageScore.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Deneme Süreci</span>
                        <span className="text-white font-bold">
                          {Math.round((player.trialMatchesPlayed / player.trialMatchesTotal) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(player.trialMatchesPlayed / player.trialMatchesTotal) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigate('talentPool', player.id)}
                        className="flex-1 bg-primary/10 border border-primary/20 text-primary py-2 rounded-xl text-xs font-bold"
                      >
                        Detaylar
                      </button>
                      {player.trialMatchesPlayed >= player.trialMatchesTotal && (
                        <button className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 py-2 rounded-xl text-xs font-bold">
                          Karar Ver
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {selectedTab === 'reports' && (
          <>
            {/* Recent Reports */}
            <div className="space-y-3">
              {recentReports.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center">
                  <Icon name="description" className="text-slate-600 mx-auto mb-3" size={48} />
                  <p className="text-sm text-slate-400">Henüz scout raporu yok</p>
                  <button
                    onClick={() => onNavigate('scoutReports')}
                    className="mt-4 bg-primary text-secondary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    İlk Raporu Oluştur
                  </button>
                </div>
              ) : (
                recentReports.map((report: any) => (
                  <div key={report.id} className="bg-surface border border-white/5 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1">{report.playerName}</h3>
                        <p className="text-xs text-slate-400">{report.scoutName} • {report.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{report.overallScore.toFixed(1)}</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={12}
                              className={i < Math.round(report.overallScore / 2) ? 'text-primary' : 'text-slate-700'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${getRecommendationColor(report.recommendation)}`}>
                      <Icon name="flag" size={14} />
                      {getRecommendationText(report.recommendation)}
                    </div>

                    {/* Key Points */}
                    {report.strengths && report.strengths.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-bold text-green-400">Güçlü Yönler:</p>
                        <ul className="space-y-1">
                          {report.strengths.slice(0, 2).map((strength: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                              <Icon name="check_circle" size={12} className="text-green-400 mt-0.5" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
