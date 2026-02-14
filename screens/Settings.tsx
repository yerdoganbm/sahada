import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface SettingsProps {
  onBack: () => void;
  currentUser: Player;
  onUpdateSettings?: (updates: Partial<Player>) => void;
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, currentUser, onUpdateSettings, onLogout }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    position: currentUser.position || 'MID',
    shirtNumber: currentUser.shirtNumber?.toString() || '',
    notifications: {
      matches: true,
      squad: true,
      payments: false
    }
  });

  const handleSave = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position as any,
        shirtNumber: formData.shirtNumber ? parseInt(formData.shirtNumber) : undefined
      });
    }
    alert('Ayarlar başarıyla kaydedildi.');
    onBack();
  };

  const toggleNotification = (key: keyof typeof formData.notifications) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  return (
    <div className="bg-secondary min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <h1 className="font-bold text-white text-lg">Hesap Ayarları</h1>
        </div>
        <button 
          onClick={handleSave}
          className="text-primary text-sm font-bold hover:text-green-400"
        >
          Kaydet
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Profile Image */}
        <div className="flex flex-col items-center py-4">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full border-2 border-primary/50 p-1">
              <img src="https://i.pravatar.cc/150?u=1" alt="Profile" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full flex items-center justify-center border border-secondary shadow-lg">
              <Icon name="photo_camera" size={16} className="text-secondary" />
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-2">Fotoğrafı Değiştir</span>
        </div>

        {/* Personal Info */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Kişisel Bilgiler</h3>
          
          <div className="bg-surface rounded-2xl p-4 border border-white/5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Ad Soyad</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase">Mevki</label>
                 <select 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                 >
                    <option value="GK">Kaleci (GK)</option>
                    <option value="DEF">Defans (DEF)</option>
                    <option value="MID">Orta Saha (MID)</option>
                    <option value="FWD">Forvet (FWD)</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase">Forma No</label>
                 <input 
                   type="number" 
                   value={formData.shirtNumber}
                   onChange={(e) => setFormData({...formData, shirtNumber: e.target.value})}
                   className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                 />
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Telefon</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">E-posta</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Bildirimler</h3>
           
           <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <ToggleItem 
                 label="Maç Hatırlatmaları" 
                 desc="Maçtan 2 saat önce bildirim al"
                 active={formData.notifications.matches} 
                 onToggle={() => toggleNotification('matches')} 
              />
              <div className="h-[1px] bg-white/5 mx-4"></div>
              <ToggleItem 
                 label="Kadro Güncellemeleri" 
                 desc="Kadro değiştiğinde haber ver"
                 active={formData.notifications.squad} 
                 onToggle={() => toggleNotification('squad')} 
              />
              <div className="h-[1px] bg-white/5 mx-4"></div>
              <ToggleItem 
                 label="Ödeme Bildirimleri" 
                 desc="Borç hatırlatmalarını göster"
                 active={formData.notifications.payments} 
                 onToggle={() => toggleNotification('payments')} 
              />
           </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Hesap İşlemleri</h3>
           
           <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left group">
                 <div className="flex items-center gap-3">
                    <Icon name="lock" className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">Şifre Değiştir</span>
                 </div>
                 <Icon name="chevron_right" className="text-slate-600" size={20} />
              </button>
              <div className="h-[1px] bg-white/5 mx-4"></div>
              <button 
                 onClick={onLogout}
                 className="w-full flex items-center justify-between p-4 hover:bg-yellow-500/10 transition-colors text-left group"
              >
                 <div className="flex items-center gap-3">
                    <Icon name="logout" className="text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">Çıkış Yap</span>
                 </div>
              </button>
              <div className="h-[1px] bg-white/5 mx-4"></div>
              <button className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors text-left group">
                 <div className="flex items-center gap-3">
                    <Icon name="delete" className="text-red-500" />
                    <span className="text-sm font-medium text-red-500">Hesabımı Sil</span>
                 </div>
              </button>
           </div>
        </section>

        <div className="text-center pt-4 pb-8">
           <p className="text-[10px] text-slate-600">Sahada App v1.0.4 • Build 2903</p>
        </div>

      </div>
    </div>
  );
};

const ToggleItem = ({ label, desc, active, onToggle }: { label: string, desc: string, active: boolean, onToggle: () => void }) => (
   <div className="flex items-center justify-between p-4">
      <div>
         <h4 className="text-sm font-bold text-white mb-0.5">{label}</h4>
         <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
      <button 
         onClick={onToggle}
         className={`w-12 h-7 rounded-full transition-colors relative ${active ? 'bg-primary' : 'bg-slate-700'}`}
      >
         <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
   </div>
);