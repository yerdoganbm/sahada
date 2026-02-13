import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Venue, Match } from '../types';

interface BookingScreenProps {
  venueId: string;
  venues: Venue[];
  onBack: () => void;
  onComplete: (match: Match) => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ venueId, venues, onBack, onComplete }) => {
  const venue = venues.find(v => v.id === venueId) || venues[0];
  
  // State
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // 0 = Today, 1 = Tomorrow...
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'summary' | 'processing' | 'success'>('selection');

  // Generate next 7 days
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dayName = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : d.toLocaleDateString('tr-TR', { weekday: 'short' });
        const dayNumber = d.getDate();
        const fullDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        arr.push({ index: i, dayName, dayNumber, fullDate });
    }
    return arr;
  }, []);

  // Generate Slots (Mock Availability Logic)
  const timeSlots = useMemo(() => {
      const slots = [];
      const startHour = 16;
      const endHour = 24;
      
      // Pseudo-random availability based on date index
      // Weekend (Friday/Saturday) is busier
      const isBusyDay = [4, 5, 6].includes((new Date().getDay() + selectedDateIndex) % 7);

      for (let h = startHour; h < endHour; h++) {
          const timeLabel = `${h}:00 - ${h+1}:00`;
          // Deterministic randomness
          const isFull = (h + selectedDateIndex) % 3 === 0 && isBusyDay; 
          slots.push({ id: `slot_${h}`, time: timeLabel, status: isFull ? 'full' : 'available', price: venue.price });
      }
      return slots;
  }, [selectedDateIndex, venue.price]);

  const activeDate = dates[selectedDateIndex];

  const handleBook = () => {
      if (!selectedSlot) return;
      setStep('summary');
  };

  const confirmPayment = () => {
      setStep('processing');
      setTimeout(() => {
          setStep('success');
      }, 2000);
  };

  const finishProcess = () => {
      // Create the Match Object
      const newMatch: Match = {
          id: `match_${Date.now()}`,
          date: activeDate.fullDate,
          time: timeSlots.find(s => s.id === selectedSlot)?.time.split(' - ')[0] || '21:00',
          location: venue.name,
          status: 'upcoming',
          pricePerPerson: Math.round(venue.price / 14), // Estimating split cost
          opponent: 'Rakip Aranıyor' // Default state
      };
      onComplete(newMatch);
  };

  if (step === 'success') {
      return (
          <div className="bg-secondary min-h-screen flex flex-col items-center justify-center p-8 text-center animate-fade-in">
             <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                <Icon name="check" size={48} className="text-white" />
             </div>
             <h1 className="text-2xl font-bold text-white mb-2">Rezervasyon Onaylandı!</h1>
             <p className="text-slate-400 mb-8">Maçın başarıyla oluşturuldu ve takvimine eklendi. Arkadaşlarını davet etmeye başlayabilirsin.</p>
             <button onClick={finishProcess} className="w-full bg-surface border border-white/10 py-4 rounded-2xl text-white font-bold">
                Maç Detaylarına Git
             </button>
          </div>
      );
  }

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex items-center gap-3 safe-top">
        <button onClick={step === 'selection' ? onBack : () => setStep('selection')} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
          <Icon name="arrow_back" className="text-white" />
        </button>
        <div>
           <h1 className="font-bold text-white text-lg leading-none">Rezervasyon Yap</h1>
           <p className="text-[10px] text-slate-400 mt-0.5">{venue.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {step === 'selection' && (
            <div className="p-4 space-y-6 animate-fade-in">
                
                {/* Date Strip */}
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">Tarih Seçimi</h3>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {dates.map((date) => (
                         <button 
                            key={date.index}
                            onClick={() => { setSelectedDateIndex(date.index); setSelectedSlot(null); }}
                            className={`min-w-[70px] p-3 rounded-2xl flex flex-col items-center border transition-all ${
                                selectedDateIndex === date.index 
                                ? 'bg-primary border-primary shadow-glow transform scale-105' 
                                : 'bg-surface border-white/5 text-slate-400'
                            }`}
                         >
                            <span className={`text-[10px] font-bold uppercase mb-1 ${selectedDateIndex === date.index ? 'text-secondary' : ''}`}>{date.dayName}</span>
                            <span className={`text-xl font-black ${selectedDateIndex === date.index ? 'text-secondary' : 'text-white'}`}>{date.dayNumber}</span>
                         </button>
                      ))}
                   </div>
                </div>

                {/* Time Grid */}
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">Saat Seçimi</h3>
                   <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                         <button
                            key={slot.id}
                            disabled={slot.status === 'full'}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`p-4 rounded-xl border relative overflow-hidden transition-all text-left ${
                                slot.status === 'full' 
                                  ? 'bg-surface/50 border-white/5 opacity-50 cursor-not-allowed' 
                                  : selectedSlot === slot.id 
                                     ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                     : 'bg-surface border-white/5 hover:border-white/20'
                            }`}
                         >
                            <span className={`block text-lg font-bold font-mono mb-1 ${selectedSlot === slot.id ? 'text-primary' : 'text-white'}`}>{slot.time}</span>
                            <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-400">₺{slot.price}</span>
                               <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                   slot.status === 'full' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                               }`}>
                                  {slot.status === 'full' ? 'DOLU' : 'BOŞ'}
                               </span>
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
            </div>
        )}

        {step === 'summary' && (
            <div className="p-6 space-y-6 animate-slide-up">
                <div className="bg-surface rounded-3xl p-6 border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                    
                    <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Seçilen Randevu</h2>
                    <div className="text-3xl font-bold text-white mb-1">{activeDate.fullDate}</div>
                    <div className="text-xl font-mono text-primary font-bold mb-6">
                        {timeSlots.find(s => s.id === selectedSlot)?.time}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Saha Ücreti</span>
                            <span className="text-sm font-bold text-white">₺{venue.price}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Hizmet Bedeli</span>
                            <span className="text-sm font-bold text-white">₺25.00</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-base font-bold text-white">Toplam</span>
                            <span className="text-2xl font-bold text-primary">₺{venue.price + 25}</span>
                        </div>
                    </div>
                </div>

                {/* Simulated Payment Form */}
                <div className="bg-surface rounded-2xl p-4 border border-white/5 opacity-80 pointer-events-none">
                    <div className="flex items-center gap-3 mb-4">
                        <Icon name="credit_card" className="text-slate-400" />
                        <span className="text-sm font-bold text-white">Kayıtlı Kart (**** 4242)</span>
                        <Icon name="check_circle" className="text-green-500 ml-auto" size={18} />
                    </div>
                    <p className="text-[10px] text-slate-500">Güvenli ödeme altyapısı ile işlem yapılacaktır.</p>
                </div>
            </div>
        )}

        {step === 'processing' && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                 <h2 className="text-xl font-bold text-white mb-2">İşleminiz Yapılıyor</h2>
                 <p className="text-slate-400 text-sm">Banka onayı bekleniyor, lütfen kapatmayınız...</p>
             </div>
        )}

      </div>

      {/* Bottom Action Bar */}
      {step !== 'processing' && (
          <div className="p-4 bg-secondary/90 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-50 safe-bottom">
              {step === 'selection' ? (
                  <button 
                    disabled={!selectedSlot}
                    onClick={handleBook}
                    className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-sm shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     Devam Et <Icon name="arrow_forward" size={18} />
                  </button>
              ) : (
                  <button 
                    onClick={confirmPayment}
                    className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-sm shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                   >
                     <Icon name="lock" size={18} /> Ödemeyi Onayla ve Bitir
                  </button>
              )}
          </div>
      )}
    </div>
  );
};
