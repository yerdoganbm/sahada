import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player, TalentPoolPlayer, ScoutReport, ScreenName } from '../types';

interface ScoutReportsProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
  talentPool: TalentPoolPlayer[];
  onCreateReport: (report: Partial<ScoutReport>) => void;
}

export const ScoutReports: React.FC<ScoutReportsProps> = ({
  onBack,
  onNavigate,
  currentUser,
  talentPool,
  onCreateReport
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Player, 2: Evaluate, 3: Summary
  const [selectedPlayer, setSelectedPlayer] = useState<TalentPoolPlayer | null>(null);
  
  // Evaluation scores
  const [technical, setTechnical] = useState({
    ballControl: 5,
    passing: 5,
    shooting: 5,
    dribbling: 5,
    firstTouch: 5
  });

  const [physical, setPhysical] = useState({
    speed: 5,
    stamina: 5,
    strength: 5,
    agility: 5
  });

  const [mental, setMental] = useState({
    positioning: 5,
    decisionMaking: 5,
    gameReading: 5,
    workRate: 5,
    teamwork: 5
  });

  const [potential, setPotential] = useState(5);
  const [recommendation, setRecommendation] = useState<'sign_now' | 'extend_trial' | 'watch_more' | 'reject'>('watch_more');
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [weaknesses, setWeaknesses] = useState<string[]>(['']);
  const [detailedNotes, setDetailedNotes] = useState('');

  // Calculate overall score
  const calculateOverallScore = () => {
    const techAvg = Object.values(technical).reduce((a, b) => a + b, 0) / Object.values(technical).length;
    const physAvg = Object.values(physical).reduce((a, b) => a + b, 0) / Object.values(physical).length;
    const mentAvg = Object.values(mental).reduce((a, b) => a + b, 0) / Object.values(mental).length;
    return Number(((techAvg * 0.4 + physAvg * 0.3 + mentAvg * 0.3)).toFixed(1));
  };

  const overallScore = calculateOverallScore();

  // Active trial players (can be scouted)
  const scoutablePlayers = talentPool.filter(p => 
    p.status === 'in_trial' || p.status === 'scouting'
  );

  const handleCreateReport = () => {
    if (!selectedPlayer) return;

    const report: Partial<ScoutReport> = {
      playerId: selectedPlayer.id,
      scoutId: currentUser.id,
      scoutName: currentUser.name,
      date: new Date().toISOString(),
      technical,
      physical,
      mental,
      overallScore,
      potential,
      recommendation,
      strengths: strengths.filter(s => s.trim()),
      weaknesses: weaknesses.filter(w => w.trim()),
      detailedNotes
    };

    onCreateReport(report);
    
    // Reset form
    setStep(1);
    setSelectedPlayer(null);
    // Reset all scores to default
    
    alert('✅ Scout raporu başarıyla oluşturuldu!');
  };

  const renderSlider = (label: string, value: number, onChange: (v: number) => void) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-white">{value.toFixed(1)}</span>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={12}
                className={i < Math.round(value / 2) ? 'text-primary' : 'text-slate-700'}
              />
            ))}
          </div>
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="bg-surface border-b border-white/5 px-4 pt-4 pb-3 sticky top-0 z-40 safe-top">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={step === 1 ? onBack : () => setStep((step - 1) as any)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
            >
              <Icon name="arrow_back" className="text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold leading-tight">Scout Raporu</h1>
              <p className="text-[10px] text-slate-400">Adım {step}/3</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  s <= step ? 'bg-primary' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Step 1: Select Player */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="bg-surface border border-white/5 rounded-2xl p-4 mb-4">
              <h2 className="text-sm font-bold text-white mb-2">Oyuncu Seç</h2>
              <p className="text-xs text-slate-400">Değerlendirmek istediğiniz oyuncuyu seçin</p>
            </div>

            {scoutablePlayers.length === 0 ? (
              <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center">
                <Icon name="person_search" className="text-slate-600 mx-auto mb-3" size={48} />
                <p className="text-sm text-slate-400">Değerlendirilebilecek aday yok</p>
              </div>
            ) : (
              scoutablePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setStep(2);
                  }}
                  className={`w-full bg-surface border rounded-2xl p-4 text-left transition-all ${
                    selectedPlayer?.id === player.id
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white">{player.name}</h3>
                        <span className={`px-2 py-0.5 border rounded-full text-xs font-bold ${
                          player.status === 'in_trial'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {player.status === 'in_trial' ? 'Deneme' : 'İzleniyor'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {player.position} • {player.age} yaş
                      </p>
                      {player.scoutReports && player.scoutReports.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {player.scoutReports.length} rapor mevcut
                        </p>
                      )}
                    </div>
                    <Icon name="chevron_right" className="text-slate-600" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Evaluation */}
        {step === 2 && selectedPlayer && (
          <div className="space-y-4">
            {/* Player Info */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <img src={selectedPlayer.avatar} alt={selectedPlayer.name} className="w-12 h-12 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-white">{selectedPlayer.name}</h3>
                <p className="text-xs text-slate-400">{selectedPlayer.position} • {selectedPlayer.age} yaş</p>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="sports_soccer" className="text-primary" size={20} />
                <h3 className="text-sm font-bold text-white">Teknik Yetenekler</h3>
              </div>
              <div className="space-y-4">
                {renderSlider('Top Kontrolü', technical.ballControl, (v) => setTechnical({...technical, ballControl: v}))}
                {renderSlider('Pas', technical.passing, (v) => setTechnical({...technical, passing: v}))}
                {renderSlider('Şut', technical.shooting, (v) => setTechnical({...technical, shooting: v}))}
                {renderSlider('Dribling', technical.dribbling, (v) => setTechnical({...technical, dribbling: v}))}
                {renderSlider('İlk Dokunuş', technical.firstTouch, (v) => setTechnical({...technical, firstTouch: v}))}
              </div>
            </div>

            {/* Physical Attributes */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="speed" className="text-green-400" size={20} />
                <h3 className="text-sm font-bold text-white">Fiziksel Özellikler</h3>
              </div>
              <div className="space-y-4">
                {renderSlider('Hız', physical.speed, (v) => setPhysical({...physical, speed: v}))}
                {renderSlider('Dayanıklılık', physical.stamina, (v) => setPhysical({...physical, stamina: v}))}
                {renderSlider('Güç', physical.strength, (v) => setPhysical({...physical, strength: v}))}
                {renderSlider('Çeviklik', physical.agility, (v) => setPhysical({...physical, agility: v}))}
              </div>
            </div>

            {/* Mental Attributes */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="psychology" className="text-purple-400" size={20} />
                <h3 className="text-sm font-bold text-white">Zihinsel Özellikler</h3>
              </div>
              <div className="space-y-4">
                {renderSlider('Pozisyon Alma', mental.positioning, (v) => setMental({...mental, positioning: v}))}
                {renderSlider('Karar Verme', mental.decisionMaking, (v) => setMental({...mental, decisionMaking: v}))}
                {renderSlider('Oyun Okuma', mental.gameReading, (v) => setMental({...mental, gameReading: v}))}
                {renderSlider('Çalışkanlık', mental.workRate, (v) => setMental({...mental, workRate: v}))}
                {renderSlider('Takım Oyunu', mental.teamwork, (v) => setMental({...mental, teamwork: v}))}
              </div>
            </div>

            {/* Potential */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="trending_up" className="text-yellow-400" size={20} />
                <h3 className="text-sm font-bold text-white">Potansiyel</h3>
              </div>
              {renderSlider('Gelecek Potansiyeli', potential, setPotential)}
            </div>

            {/* Current Overall */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Genel Değerlendirme</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-white">{overallScore}</span>
                    <span className="text-sm text-slate-400">/10</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      size={20}
                      className={i < Math.round(overallScore / 2) ? 'text-primary' : 'text-slate-700'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold shadow-glow"
            >
              Devam Et
            </button>
          </div>
        )}

        {/* Step 3: Summary & Recommendation */}
        {step === 3 && selectedPlayer && (
          <div className="space-y-4">
            {/* Overall Score Display */}
            <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 rounded-3xl p-6 text-center">
              <p className="text-xs text-slate-400 mb-2">TOPLAM PUAN</p>
              <div className="text-6xl font-black text-white mb-2">{overallScore}</div>
              <div className="flex items-center justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    name="star"
                    size={24}
                    className={i < Math.round(overallScore / 2) ? 'text-primary' : 'text-slate-700'}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-300">{selectedPlayer.name}</p>
            </div>

            {/* Recommendation */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-400 mb-3">Öneri</label>
              <div className="space-y-2">
                {[
                  { id: 'sign_now', label: 'Hemen İmzala', icon: 'check_circle', color: 'green' },
                  { id: 'extend_trial', label: 'Deneme Süresini Uzat', icon: 'schedule', color: 'yellow' },
                  { id: 'watch_more', label: 'Daha Fazla İzle', icon: 'visibility', color: 'blue' },
                  { id: 'reject', label: 'Reddet', icon: 'cancel', color: 'red' }
                ].map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setRecommendation(rec.id as any)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      recommendation === rec.id
                        ? `bg-${rec.color}-500/20 border-2 border-${rec.color}-500/50`
                        : 'bg-secondary border border-white/10'
                    }`}
                  >
                    <Icon name={rec.icon} className={`text-${rec.color}-400`} size={20} />
                    <span className="text-sm font-bold text-white">{rec.label}</span>
                    {recommendation === rec.id && (
                      <Icon name="check" className="ml-auto text-primary" size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <label className="block text-xs font-bold text-green-400 mb-3">Güçlü Yönler</label>
              {strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => {
                      const newStrengths = [...strengths];
                      newStrengths[idx] = e.target.value;
                      setStrengths(newStrengths);
                    }}
                    className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                    placeholder="Örn: Mükemmel pas yeteneği"
                  />
                  {strengths.length > 1 && (
                    <button
                      onClick={() => setStrengths(strengths.filter((_, i) => i !== idx))}
                      className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                    >
                      <Icon name="delete" className="text-red-400" size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setStrengths([...strengths, ''])}
                className="w-full py-2 rounded-xl border-2 border-dashed border-white/10 text-xs text-slate-400 hover:border-primary/30"
              >
                + Ekle
              </button>
            </div>

            {/* Weaknesses */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <label className="block text-xs font-bold text-red-400 mb-3">Zayıf Yönler</label>
              {weaknesses.map((weakness, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={weakness}
                    onChange={(e) => {
                      const newWeaknesses = [...weaknesses];
                      newWeaknesses[idx] = e.target.value;
                      setWeaknesses(newWeaknesses);
                    }}
                    className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                    placeholder="Örn: Hava topu zayıf"
                  />
                  {weaknesses.length > 1 && (
                    <button
                      onClick={() => setWeaknesses(weaknesses.filter((_, i) => i !== idx))}
                      className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                    >
                      <Icon name="delete" className="text-red-400" size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setWeaknesses([...weaknesses, ''])}
                className="w-full py-2 rounded-xl border-2 border-dashed border-white/10 text-xs text-slate-400 hover:border-primary/30"
              >
                + Ekle
              </button>
            </div>

            {/* Detailed Notes */}
            <div className="bg-surface border border-white/5 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-400 mb-3">Detaylı Notlar</label>
              <textarea
                value={detailedNotes}
                onChange={(e) => setDetailedNotes(e.target.value)}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                rows={4}
                placeholder="Performans hakkında detaylı gözlemler, özel durumlar, gelişim önerileri..."
              />
            </div>

            <button
              onClick={handleCreateReport}
              className="w-full bg-primary text-secondary py-4 rounded-2xl font-bold shadow-glow"
            >
              Raporu Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
