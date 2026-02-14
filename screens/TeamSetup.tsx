
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { TeamProfile } from '../types';

interface TeamSetupProps {
  onBack?: () => void;
  onComplete: (profile: TeamProfile) => void;
}

export const TeamSetup: React.FC<TeamSetupProps> = ({ onBack, onComplete }) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10B981');
  const [secondaryColor, setSecondaryColor] = useState('#0B0F1A');
  const [step, setStep] = useState(1);

  const colors = [
    '#10B981', '#EF4444', '#3B82F6', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'
  ];

  const handleNext = () => {
    if (step === 1 && name.length > 2) {
       setStep(2);
    } else if (step === 2 && founderName.length > 2) {
       setStep(3);
    } else if (step === 3) {
       const newTeam: TeamProfile = {
           id: `team_${Date.now()}`,
           name,
           shortName: shortName || name.substring(0, 3).toUpperCase(),
           colors: [primaryColor, secondaryColor],
           foundedYear: new Date().getFullYear().toString(),
           logo: 'https://cdn-icons-png.flaticon.com/512/1165/1165249.png',
           inviteCode: (shortName || name.substring(0, 3).toUpperCase()) + '-' + new Date().getFullYear(),
           founderName,
           founderEmail
       };
       onComplete(newTeam);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col p-6">
       {/* Header with Back Button */}
       {onBack && (
         <div className="flex items-center gap-3 mb-4 pt-4">
           <button 
             onClick={onBack}
             className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform"
           >
             <Icon name="arrow_back" className="text-white" size={20} />
           </button>
           <h2 className="text-white text-lg font-bold">Geri</h2>
         </div>
       )}
       
       {/* Progress */}
       <div className="flex gap-2 mb-8 pt-4">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
          <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`}></div>
       </div>

       <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-800 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
             <Icon name={step === 1 ? "add_business" : step === 2 ? "person" : "palette"} size={32} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
             {step === 1 ? 'Takımını Kur' : step === 2 ? 'Kurucu Bilgileri' : 'Renklerini Seç'}
          </h1>
          <p className="text-slate-400 mb-8">
             {step === 1 ? 'Efsanevi takımının adı ne olacak?' : 
              step === 2 ? 'Takımın kurucusu olarak bilgilerini gir' :
              'Sahada hangi renklerle mücadele edeceksiniz?'}
          </p>

          {step === 1 ? (
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Takım Adı</label>
                   <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Örn: Kuzey Yıldızları"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-lg font-bold"
                      autoFocus
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kısaltma (3 Harf)</label>
                   <input 
                      type="text" 
                      value={shortName}
                      onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder="Örn: KZY"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-lg font-bold tracking-widest uppercase"
                   />
                </div>
             </div>
          ) : step === 2 ? (
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Adın Soyadın</label>
                   <input 
                      type="text" 
                      value={founderName}
                      onChange={e => setFounderName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-lg font-bold"
                      autoFocus
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-posta (Opsiyonel)</label>
                   <input 
                      type="email" 
                      value={founderEmail}
                      onChange={e => setFounderEmail(e.target.value)}
                      placeholder="Örn: ahmet@example.com"
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                   />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-4">
                   <p className="text-xs text-blue-400 flex items-start gap-2">
                      <Icon name="info" size={16} className="mt-0.5" />
                      <span>Bu bilgiler sadece takım yönetimi için kullanılacaktır.</span>
                   </p>
                </div>
             </div>
          ) : (
             <div className="space-y-6">
                {/* Visual Preview */}
                <div className="bg-surface rounded-3xl p-6 border border-white/5 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}></div>
                    
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 border-white/20 shadow-xl" style={{ backgroundColor: primaryColor, color: secondaryColor === '#000000' ? 'white' : 'black' }}>
                       {shortName || 'FC'}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-white leading-tight">{name}</h3>
                       <span className="text-xs text-slate-400">Kuruluş: {new Date().getFullYear()}</span>
                    </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">Ana Renk</label>
                   <div className="flex flex-wrap gap-3">
                      {colors.map(c => (
                         <button 
                            key={c} 
                            onClick={() => setPrimaryColor(c)}
                            className={`w-10 h-10 rounded-full border-2 transition-transform ${primaryColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                         />
                      ))}
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-2 block">İkincil Renk</label>
                   <div className="flex flex-wrap gap-3">
                      {colors.map(c => (
                         <button 
                            key={c} 
                            onClick={() => setSecondaryColor(c)}
                            className={`w-10 h-10 rounded-full border-2 transition-transform ${secondaryColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                         />
                      ))}
                   </div>
                </div>
             </div>
          )}
       </div>

       <div className="pt-6 pb-safe-bottom space-y-3">
          {step > 1 && (
            <button 
               onClick={() => setStep(step - 1)}
               className="w-full bg-surface border border-white/10 text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
               <Icon name="arrow_back" /> Geri
            </button>
          )}
          <button 
             onClick={handleNext}
             disabled={(step === 1 && name.length < 3) || (step === 2 && founderName.length < 3)}
             className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-lg shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
             {step === 1 ? 'Devam Et' : step === 2 ? 'Devam Et' : 'Takımı Oluştur'} <Icon name="arrow_forward" />
          </button>
       </div>
    </div>
  );
};
