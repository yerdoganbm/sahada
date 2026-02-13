
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { JoinRequest } from '../types';

interface JoinTeamScreenProps {
  onBack: () => void;
  onSubmit: (request: JoinRequest) => void;
}

export const JoinTeamScreen: React.FC<JoinTeamScreenProps> = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState<'code' | 'phone' | 'register' | 'success'>('code');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [teamCode, setTeamCode] = useState('');
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    position: 'MID' as 'GK' | 'DEF' | 'MID' | 'FWD',
    dominantFoot: 'sag'
  });

  // Mock checking the code
  const handleCheckCode = () => {
    if (teamCode.length < 3) {
        alert('Lütfen geçerli bir kod giriniz.');
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        // Simulate code found -> Go to phone check
        setStep('phone');
    }, 800);
  };

  // Mock checking phone number (Simulating User Lookup)
  const handleCheckPhone = () => {
      if (phone.length < 10) {
          alert('Lütfen geçerli bir telefon numarası giriniz.');
          return;
      }
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          // Simulate: User not found, trigger registration flow
          setStep('register');
      }, 1000);
  };

  const handleRegisterAndJoin = () => {
     if (!formData.name || !formData.password) {
         alert('Lütfen tüm alanları doldurunuz.');
         return;
     }

     setIsLoading(true);
     setTimeout(() => {
        const request: JoinRequest = {
            id: `req_${Date.now()}`,
            name: formData.name,
            phone: phone,
            position: formData.position,
            avatar: `https://i.pravatar.cc/150?u=${phone}`, // Generate avatar based on phone
            timestamp: 'Şimdi',
            status: 'pending'
        };

        onSubmit(request);
        setStep('success');
        setIsLoading(false);
     }, 1500);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col p-6 relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

       {/* Top Bar */}
       <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
               <Icon name="arrow_back" className="text-white" />
           </button>
           <div className="flex gap-1">
               <div className={`h-1 w-8 rounded-full transition-colors ${step === 'code' ? 'bg-primary' : 'bg-primary/30'}`}></div>
               <div className={`h-1 w-8 rounded-full transition-colors ${step === 'phone' ? 'bg-primary' : 'bg-primary/30'}`}></div>
               <div className={`h-1 w-8 rounded-full transition-colors ${step === 'register' ? 'bg-primary' : 'bg-primary/30'}`}></div>
           </div>
       </div>

       <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
          
          {step === 'code' && (
             <div className="animate-fade-in">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Icon name="qr_code_scanner" size={32} className="text-blue-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Takım Kodu</h1>
                <p className="text-slate-400 mb-8">Kaptanın paylaştığı davet kodunu gir.</p>

                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Davet Kodu</label>
                      <input 
                         type="text" 
                         value={teamCode}
                         onChange={e => setTeamCode(e.target.value.toUpperCase())}
                         placeholder="Örn: KZY-2024"
                         className="w-full bg-surface border border-white/10 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all text-xl font-bold tracking-widest uppercase text-center"
                         autoFocus
                      />
                   </div>
                   
                   <button 
                       onClick={handleCheckCode}
                       disabled={isLoading}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                   >
                       {isLoading ? <Icon name="refresh" className="animate-spin" /> : 'Devam Et'}
                   </button>
                </div>
             </div>
          )}

          {step === 'phone' && (
             <div className="animate-slide-up">
                {/* Team Found Preview */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-white/10 flex items-center gap-4 mb-8 shadow-lg">
                     <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-lg">FC</div>
                     <div>
                         <h3 className="font-bold text-white text-sm">Bulunan Takım</h3>
                         <p className="text-xs text-green-400 flex items-center gap-1"><Icon name="verified" size={12} /> Kod: {teamCode}</p>
                     </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Giriş Yap</h1>
                <p className="text-slate-400 mb-8">Hesabını bulmak için numaranı gir.</p>

                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Telefon Numarası</label>
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 text-slate-400 pointer-events-none select-none font-medium">+90</div>
                        <input 
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="5XX XXX XX XX"
                            className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all text-lg font-medium tracking-wide"
                            autoFocus
                        />
                      </div>
                   </div>
                   
                   <button 
                       onClick={handleCheckPhone}
                       disabled={isLoading}
                       className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-base shadow-glow transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                   >
                       {isLoading ? <Icon name="refresh" className="animate-spin" /> : 'Kontrol Et'}
                   </button>
                </div>
             </div>
          )}

          {step === 'register' && (
             <div className="animate-slide-up">
                 <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex gap-3 mb-6">
                     <Icon name="person_add" className="text-yellow-500 shrink-0" size={20} />
                     <p className="text-xs text-yellow-200">
                         Bu numara ile kayıtlı hesap bulunamadı. Aşağıdaki formu doldurarak <strong>yeni hesap oluşturun</strong> ve takıma katılın.
                     </p>
                 </div>

                 <h1 className="text-2xl font-bold text-white mb-6">Profil Oluştur</h1>

                 <div className="space-y-3">
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ad Soyad</label>
                       <input 
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                       />
                    </div>

                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Şifre Belirle</label>
                       <input 
                          type="password" 
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          placeholder="******"
                          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                       />
                    </div>

                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Mevki</label>
                       <div className="flex gap-2 mt-1">
                           {['GK', 'DEF', 'MID', 'FWD'].map(pos => (
                               <button 
                                key={pos}
                                onClick={() => setFormData({...formData, position: pos as any})}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${formData.position === pos ? 'bg-primary text-secondary border-primary' : 'bg-surface border-white/10 text-slate-400'}`}
                               >
                                   {pos}
                               </button>
                           ))}
                       </div>
                    </div>

                    <button 
                        onClick={handleRegisterAndJoin}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-base shadow-glow transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Icon name="refresh" className="animate-spin" /> : 'Kaydol ve Katıl'}
                    </button>
                 </div>
             </div>
          )}

          {step === 'success' && (
              <div className="text-center animate-fade-in">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                      <Icon name="check" size={48} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">İstek Gönderildi!</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                      Hesabın oluşturuldu ve takıma katılım isteğin yöneticiye iletildi. Onaylandığında bildirim alacaksın.
                  </p>
                  <button 
                      onClick={onBack}
                      className="w-full bg-surface border border-white/10 text-white py-4 rounded-2xl font-bold"
                  >
                      Ana Sayfaya Dön
                  </button>
              </div>
          )}

       </div>
    </div>
  );
};
