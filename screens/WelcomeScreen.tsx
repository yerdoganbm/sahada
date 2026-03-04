import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
  onSetRole?: (role: 'captain' | 'member' | null) => void;
}

type Step = 'hero' | 'role' | 'player_start' | 'venue_start';

const STATS = [
  { value: '10K+', label: 'Oyuncu' },
  { value: '850+', label: 'Saha' },
  { value: '42K+', label: 'Maç' },
];

// ────────────────────────────────────────────────────────
// Oyuncu: "ilk adım" seçimi (bunlar birbirini DIŞLAR — farklı giriş yolları)
// ────────────────────────────────────────────────────────
const PLAYER_FIRST_STEPS = [
  {
    icon: 'link',
    emoji: '🔗',
    label: 'Davet Koduyla Katıl',
    desc: "Kaptan WhatsApp'tan link attı, hemen takıma gir",
    badge: 'En hızlı',
    badgeClass: 'bg-primary/20 text-primary',
    cta: 'phoneAuth' as ScreenName,
    role: null as 'captain' | 'member' | null,
    highlight: true,
  },
  {
    icon: 'group_add',
    emoji: '🏆',
    label: 'Takım Kur',
    desc: 'Ekibini oluştur, maç planla, ödeme takip et — kaptan olarak başla',
    badge: 'Kaptan',
    badgeClass: 'bg-yellow-500/20 text-yellow-400',
    cta: 'phoneAuth' as ScreenName,
    role: 'captain' as 'captain' | 'member' | null,
    highlight: false,
  },
  {
    icon: 'explore',
    emoji: '🔍',
    label: 'Saha Ara & Rezerve Et',
    desc: 'Yakınındaki sahaları bul, kendi adına rezervasyon yap',
    badge: null,
    badgeClass: '',
    cta: 'login' as ScreenName,
    role: 'member' as 'captain' | 'member' | null,
    highlight: false,
  },
];

// ────────────────────────────────────────────────────────
// Saha Sahibi: TÜMÜ dahil özellikler (radio DEĞİL — hepsi birden geliyor)
// ────────────────────────────────────────────────────────
const VENUE_FEATURES = [
  { icon: 'event_available', label: 'Rezervasyon Yönetimi', desc: 'Talep al, onayla/reddet, takvimi yönet' },
  { icon: 'bar_chart',       label: 'Gelir & Doluluk Analizi', desc: 'Günlük kasa, haftalık doluluk, KPI rapor' },
  { icon: 'manage_accounts', label: 'Personel & Muhasebe', desc: 'Ekip yetkilendirme, gün kapanışı' },
  { icon: 'build',           label: 'Bakım & Sorun Takibi', desc: 'Bakım görevleri, arıza bildirimleri' },
  { icon: 'location_on',     label: 'Harita & Konum', desc: 'Saha konumun, giriş noktaları, yol tarifi' },
  { icon: 'notifications',   label: 'Anlık Bildirimler', desc: 'Onay/iptal/ödeme durumu bildirimleri' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onSetRole }) => {
  const [step, setStep] = useState<Step>('hero');
  const [animating, setAnimating] = useState(false);

  // Auto-advance hero
  useEffect(() => {
    const t = setTimeout(() => { if (step === 'hero') setStep('role'); }, 2800);
    return () => clearTimeout(t);
  }, []);

  const goTo = (next: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 180);
  };

  // ── HERO ────────────────────────────────────────────────────
  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center overflow-hidden relative select-none">
        {/* Field BG */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-secondary/85" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-primary/5" />
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

          <button onClick={() => setStep('role')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all active:scale-[0.97]">
            <span>Hemen Başla</span>
            <Icon name="arrow_forward" size={18} />
          </button>
          <button onClick={() => onNavigate('login')} className="mt-4 text-slate-600 text-sm font-bold hover:text-slate-400 transition-colors">
            Zaten hesabım var →
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

  // ── ROL SEÇİMİ ─────────────────────────────────────────────
  if (step === 'role') {
    return (
      <div className={`min-h-screen bg-secondary flex flex-col overflow-hidden relative transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col flex-1 px-5 pt-14 pb-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.4)] mb-3 -rotate-3">
              <Icon name="sports_soccer" size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">SAHADA</h1>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="w-8 h-1.5 rounded-full bg-primary" />
            <div className="w-6 h-1.5 rounded-full bg-white/10" />
          </div>

          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-5">
            Kimsin?
          </p>

          <div className="space-y-3 flex-1">
            {/* Oyuncu */}
            <button onClick={() => goTo('player_start')}
              className="w-full text-left rounded-2xl border border-primary/30 p-4 bg-gradient-to-br from-primary/8 to-transparent hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.06)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 text-2xl">⚽</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-base">Oyuncuyum</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Ücretsiz</span>
                  </div>
                  <p className="text-slate-400 text-xs">Takımına katıl, RSVP ver, ödeme takip et</p>
                  <div className="flex gap-1 mt-2">
                    {['Takıma katıl', 'Borç takibi', 'İstatistik'].map(f => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 font-bold">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon name="chevron_right" size={16} className="text-slate-500" />
                </div>
              </div>
            </button>

            {/* Saha Sahibi */}
            <button onClick={() => goTo('venue_start')}
              className="w-full text-left rounded-2xl border border-blue-500/30 p-4 bg-gradient-to-br from-blue-500/8 to-transparent hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.06)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 text-2xl">🏟️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-white text-base">Saha Sahibiyim</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">İş Ortağı</span>
                  </div>
                  <p className="text-slate-400 text-xs">Rezervasyon, kasa, doluluk analizi — hepsi dahil</p>
                  <div className="flex gap-1 mt-2">
                    {['Onay/Red', 'Kasa', 'Analitik'].map(f => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500 font-bold">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon name="chevron_right" size={16} className="text-slate-500" />
                </div>
              </div>
            </button>
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
            Hesabım var, giriş yap
          </button>

          <p className="text-[9px] text-center text-slate-700 mt-5 leading-relaxed">
            Devam ederek <span className="text-slate-500 underline cursor-pointer">Kullanım Koşulları</span> ve{' '}
            <span className="text-slate-500 underline cursor-pointer">Gizlilik Politikası</span>'nı kabul edersiniz.
          </p>
        </div>
      </div>
    );
  }

  // ── OYUNCU BAŞLANGIÇ ────────────────────────────────────────
  // Radio select mantıklı: bunlar birbirini DIŞLAR (farklı giriş yolları)
  if (step === 'player_start') {
    return <PlayerStartScreen animating={animating} onBack={() => goTo('role')} onNavigate={onNavigate} onSetRole={onSetRole} />;
  }

  // ── SAHA SAHİBİ BAŞLANGIÇ ───────────────────────────────────
  // Radio YOK: tüm özellikler dahil, tek CTA
  if (step === 'venue_start') {
    return <VenueStartScreen animating={animating} onBack={() => goTo('role')} onNavigate={onNavigate} />;
  }

  return null;
};

// ─────────────────────────────────────────────────────────────
// OYUNCU EKRANI — "İlk adımın ne?" (radio mantıklı burada)
// ─────────────────────────────────────────────────────────────
const PlayerStartScreen: React.FC<{
  animating: boolean;
  onBack: () => void;
  onNavigate: (s: ScreenName, p?: any) => void;
  onSetRole?: (role: 'captain' | 'member' | null) => void;
}> = ({ animating, onBack, onNavigate, onSetRole }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const proceed = () => {
    if (selected === null) return;
    const step = PLAYER_FIRST_STEPS[selected];
    onSetRole?.(step.role);
    onNavigate(step.cta);
  };

  return (
    <div className={`min-h-screen bg-secondary flex flex-col overflow-hidden relative transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute -top-40 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-6 hover:text-white transition-colors w-fit">
          <Icon name="arrow_back" size={16} /> Geri
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-1.5 rounded-full bg-white/15" />
          <div className="w-8 h-1.5 rounded-full bg-primary" />
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">⚽</span>
          <div>
            <h2 className="text-2xl font-black text-white">Oyuncu</h2>
            <p className="text-slate-500 text-xs">İlk adımın ne olacak?</p>
          </div>
        </div>

        {/* Note: these ARE mutually exclusive entry points */}
        <p className="text-[10px] text-slate-700 mt-2 mb-5 leading-relaxed">
          Giriş yaptıktan sonra her şeye erişebilirsin. Şimdi nasıl başlamak istediğini seç.
        </p>

        <div className="space-y-3 flex-1">
          {PLAYER_FIRST_STEPS.map((path, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.99] ${
                selected === i
                  ? `border-primary/30 bg-primary/5 ${path.highlight ? 'shadow-[0_0_24px_rgba(16,185,129,0.2)]' : ''}`
                  : 'border-white/8 bg-white/2 hover:border-white/15'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl transition-all ${selected === i ? 'bg-primary/10' : 'bg-white/5'}`}>
                  {path.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-sm ${selected === i ? 'text-white' : 'text-slate-400'}`}>{path.label}</p>
                    {path.badge && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${path.badgeClass}`}>{path.badge}</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{path.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === i ? 'border-primary bg-primary' : 'border-slate-700'}`}>
                  {selected === i && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* No-code helper */}
        <div className="my-4 p-3 rounded-xl bg-white/3 border border-white/6">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            💡 <strong className="text-slate-400">Kodu yok mu?</strong> "Takım Kur"u seç → kendi grubunu oluştur ve WhatsApp'tan arkadaşlarını davet et.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={proceed} disabled={selected === null}
            className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              selected !== null ? 'bg-primary text-secondary shadow-[0_0_24px_rgba(16,185,129,0.35)]' : 'bg-white/5 text-slate-700 cursor-not-allowed'
            }`}>
            <span>Devam Et</span>
            {selected !== null && <Icon name="arrow_forward" size={18} />}
          </button>
          <button onClick={() => onNavigate('login')}
            className="w-full py-3.5 rounded-2xl border border-white/8 text-slate-500 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2">
            <Icon name="login" size={15} />
            Hesabım var, giriş yap
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

// ─────────────────────────────────────────────────────────────
// SAHA SAHİBİ EKRANI — RADIO YOK, tüm özellikler dahil, tek CTA
// ─────────────────────────────────────────────────────────────
const VenueStartScreen: React.FC<{
  animating: boolean;
  onBack: () => void;
  onNavigate: (s: ScreenName, p?: any) => void;
}> = ({ animating, onBack, onNavigate }) => {
  return (
    <div className={`min-h-screen bg-secondary flex flex-col overflow-hidden relative transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute -top-40 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8 overflow-y-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-6 hover:text-white transition-colors w-fit">
          <Icon name="arrow_back" size={16} /> Geri
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-1.5 rounded-full bg-white/15" />
          <div className="w-8 h-1.5 rounded-full bg-blue-500" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏟️</span>
          <div>
            <h2 className="text-2xl font-black text-white">Saha Sahibi</h2>
            <p className="text-slate-500 text-xs">Tüm araçlar tek pakette</p>
          </div>
        </div>

        {/* Value prop */}
        <div className="p-4 rounded-2xl bg-blue-500/8 border border-blue-500/15 mb-5">
          <p className="text-white font-bold text-sm mb-1">Kayıt olunca tüm özelliklere erişirsin</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hangi özellikten başlarsan başla — hepsine tek hesapla erişim sağlanır. Birini seçmene gerek yok.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-black text-blue-400">850+</p>
              <p className="text-[9px] text-slate-600 uppercase font-bold">Saha</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-blue-400">5dk</p>
              <p className="text-[9px] text-slate-600 uppercase font-bold">Kurulum</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-blue-400">%0</p>
              <p className="text-[9px] text-slate-600 uppercase font-bold">Komisyon</p>
            </div>
          </div>
        </div>

        {/* Feature list — ALL included */}
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Paketine dahil</p>
        <div className="space-y-2 flex-1">
          {VENUE_FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name={f.icon} size={15} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold">{f.label}</p>
                <p className="text-slate-600 text-[10px] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
              {/* All included checkmark */}
              <div className="w-5 h-5 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="check" size={11} className="text-blue-400" />
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-6 space-y-3">
          <button onClick={() => onNavigate('login')}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:shadow-[0_0_32px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]">
            <span>Sahami Kaydet &amp; Başla</span>
            <Icon name="arrow_forward" size={18} />
          </button>
          <button onClick={() => onNavigate('login')}
            className="w-full py-3.5 rounded-2xl border border-white/8 text-slate-500 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2">
            <Icon name="login" size={15} />
            Hesabım var, giriş yap
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
