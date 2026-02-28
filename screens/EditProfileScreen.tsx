
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface EditProfileScreenProps {
  onBack: () => void;
  currentUser: Player;
  onSave: (updatedUser: Player) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack, currentUser, onSave }) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    position: currentUser.position,
    phone: '0532 123 45 67', // Mock existing data
    dominantFoot: 'Sağ',
    bio: 'Futbol bir tutkudur.',
  });

  const handleSave = () => {
      // Güncellenmiş kullanıcı objesi oluştur
      const updatedUser: Player = {
        ...currentUser,
        name: formData.name,
        position: formData.position,
      };
      
      // Parent component'e gönder
      onSave(updatedUser);
      
      // Geri dön
      onBack();
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-secondary/80 backdrop-blur-xl border-b border-white/5 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="close" className="text-white" />
           </button>
           <h1 className="font-bold text-white text-lg">Profili Düzenle</h1>
        </div>
        <button onClick={handleSave} className="text-primary font-bold text-sm">Kaydet</button>
      </div>

      <div className="p-4 space-y-6">
          
          {/* Avatar Change */}
          <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          onSave({ avatar: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-600">
                        <img src={currentUser.avatar} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Icon name="photo_camera" size={24} className="text-white drop-shadow-md" />
                    </div>
                  </label>
              </div>
              <p className="text-xs text-primary mt-2 font-bold">Fotoğrafı Değiştir</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
              <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Mevki</label>
                      <select 
                        value={formData.position} 
                        onChange={e => setFormData({...formData, position: e.target.value as any})}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none appearance-none"
                      >
                          <option value="GK">Kaleci</option>
                          <option value="DEF">Defans</option>
                          <option value="MID">Orta Saha</option>
                          <option value="FWD">Forvet</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Ayak</label>
                      <select 
                        value={formData.dominantFoot} 
                        onChange={e => setFormData({...formData, dominantFoot: e.target.value})}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none appearance-none"
                      >
                          <option value="Sağ">Sağ</option>
                          <option value="Sol">Sol</option>
                          <option value="Her İkisi">Her İkisi</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Hakkında</label>
                  <textarea 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none h-24 resize-none"
                  />
              </div>
          </div>
      </div>
    </div>
  );
};
