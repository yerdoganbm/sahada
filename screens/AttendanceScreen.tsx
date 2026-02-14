
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName, Player } from '../types';

interface AttendanceScreenProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ onBack, onNavigate, currentUser }) => {
  const [step, setStep] = useState<'create' | 'result'>('create');
  
  // AUTH CHECK
  if (currentUser.role !== 'admin') {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="lock" size={32} className="text-alert" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">Yetkisiz Erişim</h2>
            <p className="text-slate-400 text-xs mb-6">Yoklama başlatmak veya yönetmek için yönetici yetkisine sahip olmalısınız.</p>
            <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs">
                Geri Dön
            </button>
        </div>
    );
  }

  // Create Form State
  const [matchDate, setMatchDate] = useState('2023-10-24');
  const [deadline, setDeadline] = useState('2023-10-23T23:00');
  const [minPlayers, setMinPlayers] = useState('14');

  // Result State (Mock)
  const results = {
      yes: 10,
      maybe: 2,
      no: 3,
      needed: 4
  };

  const handleShare = () => {
      alert('Yoklama mesajı WhatsApp grubuna gönderildi!');
      setStep('result');
  };

  return (
    <div className="bg-secondary min-h-screen pb-24">
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
         <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
           <Icon name="arrow_back" className="text-white" />
         </button>
         <h1 className="font-bold text-white text-lg">{step === 'create' ? 'Yoklama Başlat' : 'Yoklama Durumu'}</h1>
         <div className="w-10"></div>
      </div>

      <div className="p-4">
         {step === 'create' ? (
             <div className="space-y-6 animate-slide-up">
                <div className="bg-surface rounded-2xl p-5 border border-white/5 space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                          <Icon name="calendar_today" size={12} /> Maç Tarihi
                        </label>
                        <div className="relative">
                          <input 
                            type="date" 
                            value={matchDate} 
                            onChange={e => setMatchDate(e.target.value)} 
                            className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary cursor-pointer [color-scheme:dark]"
                            style={{ colorScheme: 'dark' }}
                          />
                          {!matchDate && (
                            <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                              <span className="text-slate-600 text-sm">Tarih seçin...</span>
                            </div>
                          )}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
                          <Icon name="schedule" size={12} /> Deadline (Son Yanıt)
                        </label>
                        <div className="relative">
                          <input 
                            type="datetime-local" 
                            value={deadline} 
                            onChange={e => setDeadline(e.target.value)} 
                            className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary cursor-pointer [color-scheme:dark]"
                            style={{ colorScheme: 'dark' }}
                          />
                          {!deadline && (
                            <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                              <span className="text-slate-600 text-sm">Tarih ve saat seçin...</span>
                            </div>
                          )}
                        </div>
                    </div>
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Min. Oyuncu</label>
                         <div className="flex gap-2">
                             {['12', '14', '16'].map(num => (
                                 <button key={num} onClick={() => setMinPlayers(num)} className={`flex-1 py-3 rounded-xl border text-sm font-bold ${minPlayers === num ? 'bg-primary border-primary text-secondary' : 'bg-secondary border-white/10 text-slate-400'}`}>
                                     {num} Kişi
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Preview */}
                 <div className="bg-[#DCF8C6] p-4 rounded-xl rounded-tl-none shadow-sm relative text-slate-800 text-sm">
                     <p className="font-bold mb-2">📅 MAÇ YOKLAMASI</p>
                     <p className="mb-2">Bu haftaki maçımız için kadroyu kuruyoruz. Lütfen durumunu bildir.</p>
                     <p>🗓 Tarih: {matchDate}<br/>📍 Yer: Olimpik Halı Saha</p>
                     <div className="mt-3 flex flex-col gap-1">
                         <span className="text-blue-600">Link: sahada.app/poll/xyz</span>
                     </div>
                     <div className="absolute top-2 right-2 text-[10px] text-slate-500">Önizleme</div>
                 </div>

                 <button 
                    onClick={handleShare}
                    className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                 >
                    <Icon name="whatsapp" size={20} />
                    WhatsApp'ta Paylaş
                 </button>
             </div>
         ) : (
             <div className="space-y-6 animate-fade-in">
                 {/* Stats */}
                 <div className="grid grid-cols-3 gap-3">
                     <div className="bg-surface rounded-2xl p-4 border border-white/5 text-center">
                         <span className="text-2xl font-bold text-green-500">{results.yes}</span>
                         <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Geliyor</span>
                     </div>
                     <div className="bg-surface rounded-2xl p-4 border border-white/5 text-center">
                         <span className="text-2xl font-bold text-yellow-500">{results.maybe}</span>
                         <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Belki</span>
                     </div>
                     <div className="bg-surface rounded-2xl p-4 border border-white/5 text-center">
                         <span className="text-2xl font-bold text-red-500">{results.no}</span>
                         <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Gelmeyecek</span>
                     </div>
                 </div>

                 {/* Warning */}
                 <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                     <div>
                         <h3 className="font-bold text-red-500 text-sm">Kadro Eksik!</h3>
                         <p className="text-xs text-slate-400">Min. sayıya ulaşmak için {results.needed} oyuncu daha lazım.</p>
                     </div>
                     <button 
                         onClick={() => onNavigate('reserveSystem')}
                         className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20"
                     >
                         Yedek Çağır
                     </button>
                 </div>

                 {/* Actions */}
                 <div className="space-y-3">
                     <button className="w-full bg-surface border border-white/10 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                         <Icon name="refresh" size={16} /> Durumu Güncelle
                     </button>
                     <button className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                         <Icon name="campaign" size={16} /> Son Durumu Duyur
                     </button>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
