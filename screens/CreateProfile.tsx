import React, { useState } from 'react';
import { Icon } from '../components/Icon';

interface CreateProfileProps {
  onComplete: () => void;
}

export const CreateProfile: React.FC<CreateProfileProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    position: 'MID',
    dominantFoot: 'sag',
    skill: 7
  });

  const positions = [
    { id: 'GK', label: 'Kaleci', icon: 'sports_soccer' },
    { id: 'DEF', label: 'Defans', icon: 'shield' },
    { id: 'MID', label: 'Orta Saha', icon: 'filter_center_focus' },
    { id: 'FWD', label: 'Forvet', icon: 'bolt' },
  ];

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      
      {/* Header */}
      <div className="text-center mb-8 mt-10">
        <h1 className="text-2xl font-bold text-white mb-2">Profilini Oluştur</h1>
        <p className="text-primary text-sm font-medium">Seni sahada tanımamıza yardımcı ol.</p>
      </div>

      <div className="w-full max-w-sm space-y-6 pb-10">
        
        {/* Avatar Upload */}
        <div className="flex justify-center mb-6">
           <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full border-4 border-surface bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                 <Icon name="person" size={80} className="text-slate-600" />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full flex items-center justify-center border-4 border-secondary shadow-lg active:scale-90 transition-transform">
                 <Icon name="photo_camera" size={20} className="text-secondary" />
              </div>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium whitespace-nowrap">Profil Fotoğrafı Yükle</span>
           </div>
        </div>

        {/* Nickname */}
        <div className="space-y-2 pt-4">
           <label className="text-sm font-bold text-slate-300">Takma Ad</label>
           <input 
             type="text" 
             value={formData.nickname}
             onChange={(e) => setFormData({...formData, nickname: e.target.value})}
             placeholder="Örn: Gol Makinesi"
             className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
           />
        </div>

        {/* Position Selection */}
        <div className="space-y-2">
           <label className="text-sm font-bold text-slate-300">Mevki Seçimi</label>
           <div className="grid grid-cols-4 gap-3">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setFormData({...formData, position: pos.id})}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                    formData.position === pos.id 
                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-surface border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                   <Icon name={pos.icon} size={24} className="mb-1" filled={formData.position === pos.id} />
                   <span className="text-[10px] font-bold">{pos.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Dominant Foot */}
        <div className="space-y-2">
           <label className="text-sm font-bold text-slate-300">Dominant Ayak</label>
           <div className="bg-surface p-1 rounded-xl border border-white/5 flex">
              {['sol', 'sag', 'her-ikisi'].map((foot) => (
                 <button
                   key={foot}
                   onClick={() => setFormData({...formData, dominantFoot: foot})}
                   className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                     formData.dominantFoot === foot 
                     ? 'bg-primary text-secondary shadow-lg' 
                     : 'text-slate-400 hover:text-white'
                   }`}
                 >
                    {foot === 'sol' ? 'Sol' : foot === 'sag' ? 'Sağ' : 'Her İkisi'}
                 </button>
              ))}
           </div>
        </div>

        {/* Skill Level Slider */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-300">Yetenek Seviyesi</label>
              <span className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center text-primary font-bold font-mono">
                {formData.skill}
              </span>
           </div>
           
           <div className="relative h-12 flex items-center">
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5"
                value={formData.skill}
                onChange={(e) => setFormData({...formData, skill: Number(e.target.value)})}
                className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer accent-primary z-10"
              />
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                 <span className="text-[9px] text-slate-600 font-bold mt-8">AMATÖR</span>
                 <span className="text-[9px] text-slate-600 font-bold mt-8">YARI-PRO</span>
                 <span className="text-[9px] text-slate-600 font-bold mt-8">PROFESYONEL</span>
              </div>
           </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={onComplete}
          className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-lg shadow-glow transition-all active:scale-[0.98] mt-4"
        >
           Kaydı Tamamla
        </button>
        
        <p className="text-[10px] text-slate-500 text-center italic">
           Daha sonra istediğin zaman bu ayarları düzenleyebilirsin.
        </p>

      </div>
    </div>
  );
};