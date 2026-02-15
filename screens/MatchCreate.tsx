
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Player, Match, MatchCapacity } from '../types';
import { MOCK_PLAYERS } from '../constants';

interface MatchCreateProps {
  onBack: () => void;
  venues: Venue[];
  currentUser: Player;
  players?: Player[];
  onSave: (match: Match) => void;
}

export const MatchCreate: React.FC<MatchCreateProps> = ({ onBack, venues, currentUser, players = MOCK_PLAYERS, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '21:00',
    venueId: '',
    price: '120',
    opponent: '',
    isRecurring: false,
    capacity: 14 as MatchCapacity
  });
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // AUTH CHECK
  if (currentUser.role !== 'admin' && currentUser.tier !== 'partner') {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="lock" size={40} className="text-alert" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Erişim Reddedildi</h2>
            <p className="text-slate-400 text-sm mb-6">Maç oluşturmak için yönetici veya saha partneri olmalısınız.</p>
            <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold">
                Geri Dön
            </button>
        </div>
    );
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  const selectedVenue = venues.find(v => v.id === formData.venueId);

  // --- ACTIONS ---

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.date || !formData.time) {
        alert('Lütfen tarih ve saat seçiniz.');
        return;
      }
      if (!formData.venueId) {
        alert('Lütfen bir saha seçiniz.');
        return;
      }
      const priceNum = Number(formData.price);
      if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
        alert('Kişi başı ücret 0\'dan büyük olmalıdır.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedPlayers.length === 0) {
        if (!confirm('Hiç oyuncu seçmediniz. Kadroyu boş oluşturmak istiyor musunuz?')) return;
      }
      setCurrentStep(3);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API Save
    setTimeout(() => {
        setIsLoading(false);
        
        const newMatch: Match = {
          id: `match_${Date.now()}`,
          date: formData.date,
          time: formData.time,
          location: selectedVenue?.name || 'Saha Belirsiz',
          venueId: formData.venueId,
          status: 'upcoming',
          pricePerPerson: Number(formData.price),
          opponent: formData.opponent || 'Rakip Aranıyor',
          capacity: formData.capacity
        };

        alert(`Maç başarıyla oluşturuldu! ${selectedPlayers.length} oyuncuya bildirim gönderildi.`);
        onSave(newMatch);
    }, 1500);
  };

  // --- RENDER HELPERS ---

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Maç Detayları';
      case 2: return 'Kadro Seçimi';
      case 3: return 'Önizleme ve Onay';
      default: return 'Yeni Maç';
    }
  };

  return (
    <div className="bg-secondary min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={handleBackStep} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <div>
              <h1 className="font-bold text-white text-lg leading-tight">{getStepTitle()}</h1>
              <p className="text-[10px] text-slate-400">Adım {currentStep}/3</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 pb-2">
           <StepIndicator step={1} current={currentStep} label="Detaylar" />
           <div className={`h-[2px] flex-1 mx-2 transition-colors duration-500 ${currentStep > 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
           <StepIndicator step={2} current={currentStep} label="Kadro" />
           <div className={`h-[2px] flex-1 mx-2 transition-colors duration-500 ${currentStep > 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
           <StepIndicator step={3} current={currentStep} label="Onay" />
        </div>

        {/* STEP 1: DETAILS FORM */}
        {currentStep === 1 && (
          <div className="bg-surface rounded-2xl p-4 border border-white/5 space-y-4 shadow-lg animate-fade-in">
              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Icon name="calendar_today" size={12} /> Tarih <span className="text-alert">*</span>
                     </label>
                     <div className="relative">
                       <input 
                          type="date" 
                          min={today}
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none [color-scheme:dark]"
                          style={{ colorScheme: 'dark' }}
                       />
                       {!formData.date && (
                         <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                           <span className="text-slate-600 text-sm">Tarih seçin...</span>
                         </div>
                       )}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Icon name="schedule" size={12} /> Saat <span className="text-alert">*</span>
                     </label>
                     <div className="relative">
                       <input 
                          type="time" 
                          value={formData.time}
                          onChange={e => setFormData({...formData, time: e.target.value})}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none [color-scheme:dark]"
                          style={{ colorScheme: 'dark' }}
                       />
                     </div>
                  </div>
              </div>

              {/* Venue Selection */}
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Icon name="stadium" size={12} /> Saha Seçimi <span className="text-alert">*</span>
                 </label>
                 <div className="relative">
                    <select 
                       value={formData.venueId}
                       onChange={e => setFormData({...formData, venueId: e.target.value})}
                       className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                    >
                       <option value="">Saha Seçiniz</option>
                       {venues.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.district})</option>
                       ))}
                    </select>
                    <Icon name="expand_more" className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={20} />
                 </div>
                 {selectedVenue && (
                    <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2">
                       <img src={selectedVenue.image} className="w-10 h-10 rounded-lg object-cover" />
                       <div>
                          <p className="text-xs text-white font-bold">{selectedVenue.name}</p>
                          <p className="text-[10px] text-slate-400">Önerilen Ücret: ₺{selectedVenue.price}</p>
                       </div>
                    </div>
                 )}
              </div>

              {/* Price & Opponent */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Icon name="payments" size={12} /> Kişi Başı (TL) <span className="text-alert">*</span>
                     </label>
                     <div className="relative">
                       <span className="absolute left-3 top-3 text-slate-500 font-bold">₺</span>
                       <input 
                          type="number" 
                          placeholder="120"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                          className="w-full bg-secondary border border-white/10 rounded-xl pl-8 pr-3 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono"
                       />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Icon name="groups" size={12} /> Rakip
                     </label>
                     <input 
                        type="text" 
                        placeholder="Örn: Efsaneler"
                        value={formData.opponent}
                        onChange={e => setFormData({...formData, opponent: e.target.value})}
                        className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                     />
                  </div>
              </div>

              {/* Capacity */}
              <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Icon name="groups" size={12} /> Kadro Kapasitesi <span className="text-alert">*</span>
                 </label>
                 <div className="flex gap-2">
                   {([12, 14, 16] as MatchCapacity[]).map((cap) => (
                     <button
                       key={cap}
                       type="button"
                       onClick={() => setFormData({ ...formData, capacity: cap })}
                       className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${formData.capacity === cap ? 'bg-primary text-secondary border-primary' : 'bg-secondary border-white/10 text-slate-400 hover:border-white/20'}`}
                     >
                       {cap} kişi
                     </button>
                   ))}
                 </div>
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Icon name="update" size={18} />
                      </div>
                      <div>
                          <span className="text-sm font-bold text-white block">Düzenli Maç</span>
                          <span className="text-[10px] text-slate-500">Her hafta aynı saatte tekrarla</span>
                      </div>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.isRecurring ? 'bg-primary' : 'bg-slate-700'}`}
                  >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.isRecurring ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
              </div>
          </div>
        )}

        {/* STEP 2: SQUAD SELECTION */}
        {currentStep === 2 && (
          <div className="animate-slide-up space-y-4">
             <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Oyuncu Listesi</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                   {selectedPlayers.length} Seçildi
                </span>
             </div>

             <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                {players.map((player) => {
                  const isSelected = selectedPlayers.includes(player.id);
                  return (
                    <div 
                      key={player.id}
                      onClick={() => togglePlayerSelection(player.id)}
                      className={`flex items-center p-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-600 bg-secondary'}`}>
                         {isSelected && <Icon name="check" size={14} className="text-secondary" />}
                      </div>
                      
                      <img src={player.avatar} className="w-10 h-10 rounded-full bg-slate-800 object-cover border border-white/10" />
                      
                      <div className="ml-3 flex-1">
                         <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{player.name}</h4>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold bg-secondary px-1.5 rounded border border-white/5">{player.position}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Icon name="star" size={10} className="text-yellow-500" /> {player.rating}</span>
                         </div>
                      </div>

                      <div className="text-right">
                         <span className={`text-[10px] font-bold ${player.reliability > 80 ? 'text-green-500' : 'text-yellow-500'}`}>%{player.reliability}</span>
                         <span className="block text-[8px] text-slate-600 uppercase">Güvenilirlik</span>
                      </div>
                    </div>
                  );
                })}
             </div>
             
             <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
                 <Icon name="info" className="text-blue-500 shrink-0" size={18} />
                 <p className="text-[10px] text-slate-300">
                    Seçilen oyunculara anında "Maç Daveti" bildirimi gönderilecektir. Gelmeyen oyuncuların yerine yedek listesinden otomatik ekleme yapılacaktır.
                 </p>
             </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION */}
        {currentStep === 3 && (
           <div className="animate-slide-up space-y-6">
              <div className="bg-surface rounded-3xl p-6 border border-white/5 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                 
                 <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Maç Özeti</h2>
                 
                 <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                       <div className="text-left">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tarih & Saat</span>
                          <div className="text-lg font-bold text-white">{formData.date}</div>
                          <div className="text-sm font-mono text-primary">{formData.time}</div>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Saha</span>
                          <div className="text-lg font-bold text-white">{selectedVenue?.name}</div>
                          <div className="text-sm text-slate-400">{selectedVenue?.district}</div>
                       </div>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full"></div>

                    <div className="flex justify-between items-center">
                       <div className="text-left">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Davetli Sayısı</span>
                          <div className="flex items-center gap-2">
                             <div className="flex -space-x-2">
                                {selectedPlayers.slice(0, 4).map(id => {
                                   const p = players.find(mp => mp.id === id);
                                   return <img key={id} src={p?.avatar} className="w-6 h-6 rounded-full border border-secondary" />;
                                })}
                                {selectedPlayers.length > 4 && (
                                   <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[8px] border border-secondary text-white">+{selectedPlayers.length - 4}</div>
                                )}
                             </div>
                             <span className="text-sm font-bold text-white">{selectedPlayers.length} Oyuncu</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Kişi Başı</span>
                          <div className="text-xl font-bold text-primary font-mono">₺{formData.price}</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-start gap-3 px-2">
                 <input type="checkbox" className="mt-1 accent-primary w-4 h-4 rounded" defaultChecked />
                 <p className="text-xs text-slate-400">
                    Saha kiralama kurallarını okudum ve kabul ediyorum. Maç iptal süresi <span className="text-white font-bold">48 saattir</span>.
                 </p>
              </div>
           </div>
        )}

      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 safe-bottom z-50">
        {currentStep < 3 ? (
           <button 
             onClick={handleNext}
             className="w-full bg-primary hover:bg-green-400 text-secondary py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.98]"
           >
             Devam Et <Icon name="arrow_forward" size={18} />
           </button>
        ) : (
           <button 
             onClick={handleSave}
             disabled={isLoading}
             className="w-full bg-primary hover:bg-green-400 text-secondary py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isLoading ? <Icon name="refresh" className="animate-spin" /> : <Icon name="check" size={20} />}
             Maçı Yayınla
           </button>
        )}
      </div>

    </div>
  );
};

// UI Components for Wizard
const StepIndicator = ({ step, current, label }: { step: number, current: number, label: string }) => {
   const isActive = step === current;
   const isCompleted = step < current;

   return (
      <div className="flex flex-col items-center gap-1">
         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            isActive ? 'bg-primary text-secondary scale-110 shadow-glow' : 
            isCompleted ? 'bg-primary/20 text-primary border border-primary' : 
            'bg-surface border border-white/10 text-slate-500'
         }`}>
            {isCompleted ? <Icon name="check" size={16} /> : step}
         </div>
         <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>{label}</span>
      </div>
   );
};
