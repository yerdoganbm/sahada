
import React, { useState } from 'react';
import { Icon } from '../components/Icon';

interface LoginScreenProps {
  onLogin: (userId: string, isNewTeam?: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!phone) {
      // Visual feedback instead of native alert
      return;
    }

    setIsLoading(true);
    
    // Simulate API / Auth Delay
    setTimeout(() => {
        setIsLoading(false);
        
        // Mock Logic for Testing Roles based on input
        if (phone.includes('admin') || phone === '1') {
            onLogin('1'); // Admin (Ahmet)
        } else if (phone.includes('kaptan') || phone === '7') {
             onLogin('7'); // Captain (Burak)
        } else if (phone === '2') {
             onLogin('2'); // Member (Mehmet)
        } else {
             // Pass the entered phone number directly to App.tsx to handle lookup
             // This fixes the issue where new users were logging in as Mehmet
             onLogin(phone); 
        }
    }, 1500);
  };

  const handleCreateTeam = () => {
    // ÖN KONTROL: Telefon numarası girilmiş mi?
    if (!phone || phone.trim().length < 10) {
      return;
    }

    // ÖN KONTROL: Geçerli bir telefon numarası mı?
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
        console.log('📞 Telefon doğrulandı:', phone);
        console.log('🏆 Yeni takım kurma işlemi başlatılıyor...');
        // Log in as a new user who will be admin
        onLogin('new_admin_' + Date.now(), true);
        setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none"></div>
      
      <div className="w-full max-w-sm z-10 animate-fade-in space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-surface border border-white/5 shadow-glow mb-2 transform rotate-3">
              <Icon name="sports_soccer" size={40} className="text-primary" />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Giriş Yap</h1>
              <p className="text-slate-400 text-sm mt-1">Numaran ile hızlıca sahalara dön.</p>
           </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Telefon Numarası</label>
                <div className="relative">
                    <div className="absolute left-4 top-3.5 text-slate-400 pointer-events-none select-none font-medium">+90</div>
                    <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="5XX XXX XX XX"
                        className="w-full bg-surface border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-base font-medium tracking-wide"
                        autoFocus
                    />
                </div>
            </div>

            <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-green-400 text-secondary py-4 rounded-2xl font-bold text-base shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
                {isLoading ? (
                    <Icon name="refresh" className="animate-spin" />
                ) : (
                    <>
                        Devam Et <Icon name="arrow_forward" size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
            <div className="h-[1px] bg-white/5 flex-1"></div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Veya</span>
            <div className="h-[1px] bg-white/5 flex-1"></div>
        </div>

        {/* Secondary Action */}
        <button 
             onClick={handleCreateTeam}
             className="w-full bg-surface hover:bg-white/5 border border-white/10 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
             <Icon name="add_circle" size={18} className="text-slate-400" />
             Takımını Sıfırdan Kur
        </button>

        {/* Privacy Note */}
        <p className="text-[10px] text-center text-slate-600 max-w-xs mx-auto leading-relaxed">
           Giriş yaparak Sahada uygulamasının <span className="text-slate-500 underline">Kullanım Koşulları</span>'nı kabul etmiş sayılırsınız.
           <br/><br/>
           <span className="opacity-30 select-none">(Test: Admin=1, Kaptan=7, Üye=2)</span>
        </p>

      </div>
    </div>
  );
};
