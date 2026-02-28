
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { MOCK_PLAYERS } from '../constants';
import { ScreenName, Player } from '../types';

interface ReserveSystemProps {
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  currentUser: Player;
}

export const ReserveSystem: React.FC<ReserveSystemProps> = ({ onBack, onNavigate, currentUser }) => {
  // Filter mock players to create a dummy reserve list
  const [reserves, setReserves] = useState(MOCK_PLAYERS.slice(10, 16));
  const [isAutoCallActive, setIsAutoCallActive] = useState(false);

  // AUTH CHECK
  if (currentUser.role !== 'admin') {
    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-alert/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="lock" size={32} className="text-alert" />
            </div>
            <h2 className="text-white text-lg font-bold mb-2">Yetkisiz Erişim</h2>
            <p className="text-slate-400 text-xs mb-6">Yedek listesini yönetmek için yönetici yetkisine sahip olmalısınız.</p>
            <button onClick={onBack} className="bg-surface border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-xs">
                Geri Dön
            </button>
        </div>
    );
  }

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newReserves = [...reserves];
    [newReserves[index - 1], newReserves[index]] = [newReserves[index], newReserves[index - 1]];
    setReserves(newReserves);
  };

  const handleManualCall = (name: string) => {
      alert(`${name} kişisine WhatsApp mesajı gönderiliyor...`);
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
         <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
           <Icon name="arrow_back" className="text-white" />
         </button>
         <h1 className="font-bold text-white text-lg">Yedek Sistemi</h1>
         <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
         {/* Automation Toggle */}
         <div className="bg-surface rounded-2xl p-4 border border-white/5 flex items-center justify-between">
             <div>
                 <h3 className="text-sm font-bold text-white">Otomatik Çağırma</h3>
                 <p className="text-[10px] text-slate-400">Sıradaki yedeğe otomatik mesaj at</p>
             </div>
             <button 
                 onClick={() => setIsAutoCallActive(!isAutoCallActive)}
                 className={`w-12 h-6 rounded-full relative transition-colors ${isAutoCallActive ? 'bg-primary' : 'bg-slate-700'}`}
             >
                 <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAutoCallActive ? 'translate-x-6' : 'translate-x-0'}`} />
             </button>
         </div>

         {/* Priority List */}
         <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-3">Öncelik Sırası</h3>
             <div className="space-y-2">
                 {reserves.map((player, index) => (
                     <div key={player.id} className="bg-surface rounded-xl p-3 border border-white/5 flex items-center gap-3 group">
                         <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                             {index + 1}
                         </div>
                         <img src={player.avatar} className="w-8 h-8 rounded-full" />
                         <div className="flex-1">
                             <h4 className="text-sm font-bold text-white">{player.name}</h4>
                             <span className="text-[10px] text-slate-400">{player.position} • {player.rating} Reyting</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => moveUp(index)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white">
                                 <Icon name="keyboard_arrow_up" />
                             </button>
                             <button 
                                onClick={() => handleManualCall(player.name)}
                                className="bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 rounded-lg text-[10px] font-bold border border-[#25D366]/20"
                             >
                                 Çağır
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
         </div>

         <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
             <Icon name="info" className="text-blue-500 shrink-0" />
             <p className="text-xs text-slate-300">
                 Otomatik sistem, bir oyuncu 15 dakika içinde yanıt vermezse sıradaki oyuncuya geçer.
             </p>
         </div>
      </div>
    </div>
  );
};
