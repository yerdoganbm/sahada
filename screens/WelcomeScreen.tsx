import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
}

type Step = 'hero' | 'role' | 'player_detail' | 'venue_detail';
type Role = 'player' | 'venue_owner' | null;

const STATS = [
  { value: '10K+', label: 'Oyuncu' },
  { value: '850+', label: 'Saha' },
  { value: '42K+', label: 'Maç' },
];

const PLAYER_PATHS = [
  { icon: 'link', label: 'Davet Koduyla Katıl', desc: "WhatsApp'tan gelen linkle saniyeler içinde takıma gir", cta: 'phoneAuth', highlight: true },
  { icon: 'sports_soccer', label: 'Maç Oluştur & Oyna', desc: 'Kendi maçını planla veya mevcut maçlara katıl', cta: 'login', highlight: false },
  { icon: 'group_add', label: 'Takım Kur', desc: 'Ekibini oluştur, ödeme takip et, istatistik izle', cta: 'login', highlight: false },
];

const VENUE_PATHS = [
  { icon: 'event_available', label: 'Rezervasyonları Yönet', desc: 'Talepleri onayla, takvimi kontrol et', cta: 'login', highlight: false },
  { icon: 'bar_chart', label: 'Gelir & Doluluk Raporu', desc: 'Kasa, günlük kapanış, analitik', cta: 'login', highlight: false },
  { icon: 'manage_accounts', label: 'Ekip Yönetimi', desc: 'Personel, muhasebe, bakım takibi', cta: 'login', highlight: false },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  // Deep link: if ?code= is present, skip role selection and go straight to join
  // This is handled by App.tsx useEffect, but we can show a shortcut banner here.
  const [step, setStep] = useState<Step>('hero');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 'hero') setStep('role');
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  const goTo = (next: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 200);
  };

  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center overflow-hidden relative select-none">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-secondary/80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-primary/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary/8" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/4" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-8">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-primary via-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)] mb-8 -rotate-6">
            <Icon name="sports_soccer" size={52} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter italic leading-none mb-2">SAHADA</h1>
          <p className="text-slate-400 text-lg font-light tracking-widest">
            Maç Senin. <span className="text-primary font-bold">Kontrol Sende.</span>
          </p>

          <div className="flex items-center gap-8 mt-10 mb-12">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{s.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('role')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all active:scale-[0.97]"
          >
            <span>Hemen Başla</span>
            <Icon name="arrow_forward" size={18} />
          </button>
          <button onClick={() => onNavigate('login')} className="mt-4 text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors">
            Zaten hesabım var, giriş yap →
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-white/15" />
          <div className="w-2 h-2 rounded-full bg-white/15" />
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className={`min-h-screen bg-secondary flex flex-col overflow-hidden relative transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col flex-1 px-5 pt-14 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)] mb-3 -rotate-3">
              <Icon name="sports_soccer" size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">SAHADA</h1>
            <p className="text-slate-500 text-xs mt-1 tracking-widest">Maç Senin. <span className="text-primary font-bold">Kontrol Sende.</span></p>
          </div>

          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="w-8 h-1.5 rounded-full bg-primary" />
            <div className="w-6 h-1.5 rounded-full bg-white/10" />
            <div className="w-6 h-1.5 rounded-full bg-white/10" />
          </div>

          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-5">
            Nasıl kullanmak istiyorsun?
          </p>

          <div className="space-y-3 flex-1">
            <RoleCard
              emoji="⚽"
              title="Oyuncuyum"
              subtitle="Maç oyna, takım yönet, ödeme takip et"
              accentClass="from-primary/10 border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
              badgeText="Ücretsiz"
              badgeClass="bg-primary/15 text-primary"
              features={['Takıma katıl', 'Borç takibi', 'İstatistik']}
              onClick={() => goTo('player_detail')}
            />
            <RoleCard
              emoji="🏟️"
              title="Saha Sahibiyim"
              subtitle="Rezervasyon, kasa, doluluk analizi"
              accentClass="from-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
              badgeText="İş Ortağı"
              badgeClass="bg-blue-500/15 text-blue-400"
              features={['Onay/Red', 'Gelir raporu', 'Personel']}
              onClick={() => goTo('venue_detail')}
            />
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">veya</span>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <button onClick={() => onNavigate('phoneAuth')}
            className="w-full py-3.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:bg-emerald-500/12 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            <Icon name="link" size={15} />
            Davet Koduyla Hızlı Gir
          </button>
          <button onClick={() => onNavigate('login')}
            className="w-full mt-2 py-3.5 rounded-2xl border border-white/8 text-slate-500 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2">
            <Icon name="login" size={15} />
            Zaten hesabım var
          </button>

          <p className="text-[9px] text-center text-slate-700 mt-5 leading-relaxed">
            Devam ederek <span className="text-slate-500 underline cursor-pointer">Kullanım Koşulları</span> ve{' '}
            <span className="text-slate-500 underline cursor-pointer">Gizlilik Politikası</span>'nı kabul edersiniz.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'player_detail' || step === 'venue_detail') {
    const isPlayer = step === 'player_detail';
    const paths = isPlayer ? PLAYER_PATHS : VENUE_PATHS;
    return (
      <DetailScreen
        animating={animating}
        onBack={() => goTo('role')}
        emoji={isPlayer ? '⚽' : '🏟️'}
        title={isPlayer ? 'Oyuncu' : 'Saha Sahibi'}
        subtitle="Ne yapmak istiyorsun?"
        accentColor={isPlayer ? 'primary' : 'blue'}
        paths={paths}
        onNavigate={onNavigate}
      />
    );
  }

  return null;
};

interface RoleCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  accentClass: string;
  badgeText: string;
  badgeClass: string;
  features: string[];
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ emoji, title, subtitle, accentClass, badgeText, badgeClass, features, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border p-4 bg-gradient-to-br to-transparent transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${accentClass}`}
  >
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 text-2xl">{emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-black text-white text-base">{title}</h3>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{subtitle}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {features.map((f, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-bold">{f}</span>
          ))}
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon name="chevron_right" size={16} className="text-slate-500" />
      </div>
    </div>
  </button>
);

interface PathItem {
  icon: string;
  label: string;
  desc: string;
  cta: string;
  highlight: boolean;
}

interface DetailScreenProps {
  animating: boolean;
  onBack: () => void;
  emoji: string;
  title: string;
  subtitle: string;
  accentColor: 'primary' | 'blue';
  paths: PathItem[];
  onNavigate: (screen: ScreenName, params?: any) => void;
}

const DetailScreen: React.FC<DetailScreenProps> = ({ animating, onBack, emoji, title, subtitle, accentColor, paths, onNavigate }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const ac = accentColor === 'primary'
    ? { glow: 'shadow-[0_0_28px_rgba(16,185,129,0.35)]', btnOn: 'bg-primary text-secondary', btnOff: 'bg-white/5 text-slate-700 cursor-not-allowed', border: 'border-primary/30 bg-primary/5', iconBg: 'bg-primary/10', iconTxt: 'text-primary', bar: 'bg-primary', radio: 'border-primary bg-primary' }
    : { glow: 'shadow-[0_0_28px_rgba(59,130,246,0.35)]', btnOn: 'bg-blue-500 text-white', btnOff: 'bg-white/5 text-slate-700 cursor-not-allowed', border: 'border-blue-500/30 bg-blue-500/5', iconBg: 'bg-blue-500/10', iconTxt: 'text-blue-400', bar: 'bg-blue-500', radio: 'border-blue-500 bg-blue-500' };

  const handleProceed = () => {
    if (selected === null) return;
    const path = paths[selected];
    if (path.cta === 'phoneAuth') {
      onNavigate('phoneAuth'); // join link → auto-member role set in App.tsx
    } else {
      onNavigate('login', { userType: accentColor === 'primary' ? 'player' : 'venue_owner' });
    }
  };

  return (
    <div className={`min-h-screen bg-secondary flex flex-col overflow-hidden relative transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute -top-40 -right-20 w-80 h-80 rounded-full blur-3xl ${accentColor === 'primary' ? 'bg-primary/5' : 'bg-blue-500/5'}`} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-6 hover:text-white transition-colors w-fit">
          <Icon name="arrow_back" size={16} />
          Geri
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-1.5 rounded-full bg-white/15" />
          <div className={`w-8 h-1.5 rounded-full ${ac.bar}`} />
          <div className="w-6 h-1.5 rounded-full bg-white/10" />
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-3 mt-6 flex-1">
          {paths.map((path, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.99] ${
                selected === i ? `${ac.border} ${path.highlight ? ac.glow : ''}` : 'border-white/8 bg-white/2 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${selected === i ? ac.iconBg : 'bg-white/5'}`}>
                  <Icon name={path.icon} size={20} className={selected === i ? ac.iconTxt : 'text-slate-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm transition-colors ${selected === i ? 'text-white' : 'text-slate-400'}`}>{path.label}</p>
                    {path.highlight && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wide">Hızlı</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{path.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === i ? ac.radio : 'border-slate-700'}`}>
                  {selected === i && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleProceed}
            disabled={selected === null}
            className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] ${selected !== null ? `${ac.btnOn} ${ac.glow}` : ac.btnOff}`}
          >
            <span>Devam Et</span>
            {selected !== null && <Icon name="arrow_forward" size={18} />}
          </button>
          <button
            onClick={() => onNavigate('login', { userType: accentColor === 'primary' ? 'player' : 'venue_owner' })}
            className="w-full py-3.5 rounded-2xl border border-white/8 text-slate-500 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="login" size={15} />
            Zaten hesabım var, giriş yap
          </button>
        </div>

        <p className="text-[9px] text-center text-slate-700 mt-5 leading-relaxed">
          Devam ederek <span className="text-slate-500 underline cursor-pointer">Kullanım Koşulları</span> ve{' '}
          <span className="text-slate-500 underline cursor-pointer">Gizlilik Politikası</span>'nı kabul edersiniz.
        </p>
      </div>
    </div>
  );
};
