import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player, TalentPoolPlayer, ScreenName } from '../types';

interface TalentPoolProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
  talentPool: TalentPoolPlayer[];
  onAddCandidate: (data: Partial<TalentPoolPlayer>) => void;
  onMakeDecision: (playerId: string, decision: 'sign' | 'reject' | 'extend_trial', notes: string) => void;
}

export const TalentPool: React.FC<TalentPoolProps> = ({
  onBack,
  onNavigate,
  currentUser,
  talentPool,
  onAddCandidate,
  onMakeDecision
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'scouting' | 'in_trial' | 'approved' | 'rejected'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<TalentPoolPlayer | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // Form state for adding candidate
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: 'MID' as 'GK' | 'DEF' | 'MID' | 'FWD',
    contactNumber: '',
    source: 'referral' as any,
    notes: ''
  });

  // Decision form
  const [decisionData, setDecisionData] = useState({
    decision: 'sign' as 'sign' | 'reject' | 'extend_trial',
    notes: ''
  });

  const filteredPool = filterStatus === 'all' 
    ? talentPool 
    : talentPool.filter(p => p.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scouting': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_trial': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'signed': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scouting': return 'İzleniyor';
      case 'in_trial': return 'Deneme';
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      case 'signed': return 'İmzalandı';
      default: return status;
    }
  };

  const handleAddCandidate = () => {
    if (!formData.name || !formData.age || !formData.contactNumber) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const newCandidate: Partial<TalentPoolPlayer> = {
      name: formData.name,
      age: parseInt(formData.age),
      position: formData.position,
      contactNumber: formData.contactNumber,
      discoveredBy: currentUser.id,
      discoveredDate: new Date().toISOString(),
      source: formData.source,
      status: 'scouting',
      trialMatchesPlayed: 0,
      trialMatchesTotal: 3,
      scoutReports: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
    };

    onAddCandidate(newCandidate);
    setShowAddModal(false);
    setFormData({
      name: '',
      age: '',
      position: 'MID',
      contactNumber: '',
      source: 'referral',
      notes: ''
    });
    alert('✅ Aday başarıyla eklendi!');
  };

  const handleMakeDecision = () => {
    if (!selectedPlayer) return;
    if (!decisionData.notes.trim()) {
      alert('Lütfen karar notunuzu girin');
      return;
    }

    onMakeDecision(selectedPlayer.id, decisionData.decision, decisionData.notes);
    setShowDecisionModal(false);
    setSelectedPlayer(null);
    setDecisionData({ decision: 'sign', notes: '' });
    
    const decisionText = decisionData.decision === 'sign' ? 'İmzalandı' : 
                        decisionData.decision === 'reject' ? 'Reddedildi' : 
                        'Deneme süresi uzatıldı';
    alert(`✅ ${selectedPlayer.name} - ${decisionText}`);
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
              <h1 className="text-white font-bold leading-tight">Aday Havuzu</h1>
              <p className="text-[10px] text-slate-400">{filteredPool.length} aday</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow active:scale-95 transition-transform"
          >
            <Icon name="person_add" size={16} />
            Aday Ekle
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'Tümü', count: talentPool.length },
            { id: 'scouting', label: 'İzleniyor', count: talentPool.filter(p => p.status === 'scouting').length },
            { id: 'in_trial', label: 'Deneme', count: talentPool.filter(p => p.status === 'in_trial').length },
            { id: 'approved', label: 'Onaylı', count: talentPool.filter(p => p.status === 'approved').length },
            { id: 'rejected', label: 'Reddedildi', count: talentPool.filter(p => p.status === 'rejected').length }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterStatus(filter.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === filter.id
                  ? 'bg-primary text-secondary'
                  : 'bg-surface text-slate-400 border border-white/5'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {filteredPool.length === 0 ? (
          <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center">
            <Icon name="person_search" className="text-slate-600 mx-auto mb-3" size={48} />
            <p className="text-sm text-slate-400 mb-4">Bu kategoride aday bulunamadı</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-secondary px-6 py-2 rounded-xl text-xs font-bold"
            >
              İlk Adayı Ekle
            </button>
          </div>
        ) : (
          filteredPool.map((player) => (
            <div key={player.id} className="bg-surface border border-white/5 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-full" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{player.name}</h3>
                    <span className={`px-2 py-0.5 border rounded-full text-xs font-bold ${getStatusColor(player.status)}`}>
                      {getStatusText(player.status)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-2">
                    {player.position} • {player.age} yaş • {player.source === 'referral' ? 'Referans' : player.source}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-xs">
                    {player.status === 'in_trial' && (
                      <div className="flex items-center gap-1">
                        <Icon name="event" size={14} className="text-slate-500" />
                        <span className="text-slate-400">{player.trialMatchesPlayed}/{player.trialMatchesTotal} maç</span>
                      </div>
                    )}
                    
                    {player.scoutReports && player.scoutReports.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Icon name="description" size={14} className="text-slate-500" />
                        <span className="text-slate-400">{player.scoutReports.length} rapor</span>
                      </div>
                    )}
                    
                    {player.averageScore && (
                      <div className="flex items-center gap-1">
                        <Icon name="star" size={14} className="text-primary" />
                        <span className="text-white font-bold">{player.averageScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress (for trial players) */}
                  {player.status === 'in_trial' && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(player.trialMatchesPlayed / player.trialMatchesTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 bg-primary/10 border border-primary/20 text-primary py-2 rounded-xl text-xs font-bold">
                      Detaylar
                    </button>
                    
                    {player.status === 'in_trial' && player.trialMatchesPlayed >= player.trialMatchesTotal && !player.finalDecision && (
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowDecisionModal(true);
                        }}
                        className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 py-2 rounded-xl text-xs font-bold"
                      >
                        Karar Ver
                      </button>
                    )}

                    {player.status === 'scouting' && (
                      <button className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-2 rounded-xl text-xs font-bold">
                        <Icon name="add_circle" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-fade-in">
          <div className="bg-surface w-full rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni Aday Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Icon name="close" className="text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Yaş *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Mevki *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value as any})}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="GK">Kaleci</option>
                    <option value="DEF">Defans</option>
                    <option value="MID">Orta Saha</option>
                    <option value="FWD">Forvet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Telefon *</label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white"
                  placeholder="5XX XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Kaynak</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value as any})}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="referral">Referans</option>
                  <option value="open_trial">Açık Deneme</option>
                  <option value="tournament">Turnuva</option>
                  <option value="social_media">Sosyal Medya</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                  rows={3}
                  placeholder="İlk izlenim, öneriler vb."
                />
              </div>

              <button
                onClick={handleAddCandidate}
                className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold shadow-glow"
              >
                Adayı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end animate-fade-in">
          <div className="bg-surface w-full rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Karar Ver</h2>
              <button onClick={() => setShowDecisionModal(false)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Icon name="close" className="text-white" />
              </button>
            </div>

            {/* Player Info */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-secondary rounded-xl">
              <img src={selectedPlayer.avatar} alt={selectedPlayer.name} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white">{selectedPlayer.name}</h3>
                <p className="text-xs text-slate-400">{selectedPlayer.position} • {selectedPlayer.trialMatchesPlayed} maç tamamlandı</p>
              </div>
            </div>

            {/* Decision Options */}
            <div className="space-y-3 mb-6">
              {[
                { id: 'sign', label: 'İmzala', icon: 'check_circle', color: 'green' },
                { id: 'extend_trial', label: 'Deneme Süresini Uzat', icon: 'schedule', color: 'yellow' },
                { id: 'reject', label: 'Reddet', icon: 'cancel', color: 'red' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDecisionData({...decisionData, decision: option.id as any})}
                  className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                    decisionData.decision === option.id
                      ? `bg-${option.color}-500/20 border-2 border-${option.color}-500/50`
                      : 'bg-secondary border border-white/10'
                  }`}
                >
                  <Icon name={option.icon} className={`text-${option.color}-400`} size={24} />
                  <span className="text-sm font-bold text-white">{option.label}</span>
                  {decisionData.decision === option.id && (
                    <Icon name="check" className="ml-auto text-primary" size={20} />
                  )}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 mb-2">Karar Notu *</label>
              <textarea
                value={decisionData.notes}
                onChange={(e) => setDecisionData({...decisionData, notes: e.target.value})}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                rows={3}
                placeholder="Kararınızın gerekçesini yazın..."
              />
            </div>

            <button
              onClick={handleMakeDecision}
              className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold shadow-glow"
            >
              Kararı Onayla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
