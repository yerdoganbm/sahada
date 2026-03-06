import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { ScreenName } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
  onSetRole?: (role: 'captain' | 'member' | null) => void;
}

type Step = 'hero' | 'player_start' | 'venue_start' | 'venue_staff_start';

const PLAYER_FIRST_STEPS = [
  {
    emoji: '🔗',
    label: 'Davet Koduyla Katıl',
    desc: "Kaptan WhatsApp'tan link attı, hemen takıma gir",
    badge: 'En hızlı',
    badgeColor: '#10B981',
    cta: 'phoneAuth' as ScreenName,
    role: null as 'captain' | 'member' | null,
    highlight: true,
  },
  {
    emoji: '🏆',
    label: 'Takım Kur',
    desc: 'Ekibini oluştur, maç planla, ödeme takip et',
    badge: 'Kaptan',
    badgeColor: '#F59E0B',
    cta: 'phoneAuth' as ScreenName,
    role: 'captain' as 'captain' | 'member' | null,
    highlight: false,
  },
  {
    emoji: '🔍',
    label: 'Saha Ara & Rezerve Et',
    desc: 'Yakınındaki sahaları bul, kendi adına rezervasyon yap',
    badge: null,
    badgeColor: '',
    cta: 'login' as ScreenName,
    role: 'member' as 'captain' | 'member' | null,
    highlight: false,
  },
];

const VENUE_FEATURES = [
  { icon: 'event_available', label: 'Rezervasyon Yönetimi',   desc: 'Talep al, onayla/reddet, takvimi yönet' },
  { icon: 'bar_chart',       label: 'Gelir & Doluluk Analizi', desc: 'Günlük kasa, haftalık doluluk, KPI' },
  { icon: 'manage_accounts', label: 'Personel & Muhasebe',     desc: 'Ekip yetkilendirme, gün kapanışı' },
  { icon: 'build',           label: 'Bakım & Sorun Takibi',    desc: 'Bakım görevleri, arıza bildirimleri' },
  { icon: 'notifications',   label: 'Anlık Bildirimler',       desc: 'Onay/iptal/ödeme durumu bildirimleri' },
];

// ─── ROLE CARD DATA ─────────────────────────────────────────
const ROLES = [
  {
    id: 'player',
    emoji: '⚽',
    title: 'Oyuncuyum',
    subtitle: 'Oyna, takip et, kazan',
    color: '#10B981',
    colorDim: 'rgba(16,185,129,0.12)',
    colorBorder: 'rgba(16,185,129,0.3)',
    badge: 'Ücretsiz',
    perks: [
      { icon: '🔗', text: 'WhatsApp davet linkiyle saniyeler içinde gir' },
      { icon: '💸', text: 'Ödeme takibi — kaptana gönder, kanıt yükle' },
      { icon: '📊', text: 'Maç istatistikleri ve RSVP yönetimi' },
    ],
  },
  {
    id: 'venue',
    emoji: '🏟️',
    title: 'Saha Sahibiyim',
    subtitle: 'Yönet, analiz et, büyüt',
    color: '#3B82F6',
    colorDim: 'rgba(59,130,246,0.12)',
    colorBorder: 'rgba(59,130,246,0.3)',
    badge: 'İş Ortağı',
    perks: [
      { icon: '📅', text: 'Rezervasyon takvimi & onay/red akışı' },
      { icon: '💰', text: 'Kasa, günlük kapanış, gelir raporu' },
      { icon: '👥', text: 'Personel yönetimi ve bakım takibi' },
    ],
  },
  {
    id: 'venue_staff',
    emoji: '👷',
    title: 'Sahada Çalışıyorum',
    subtitle: 'Personel veya muhasebe girişi',
    color: '#8B5CF6',
    colorDim: 'rgba(139,92,246,0.12)',
    colorBorder: 'rgba(139,92,246,0.3)',
    badge: 'Personel',
    perks: [
      { icon: '📋', text: 'Rezervasyon takibi ve takvim görünümü' },
      { icon: '💳', text: 'Gelen EFT ve kasa hareketleri' },
      { icon: '📊', text: 'Muhasebe rolüyle gelir raporlarına eriş' },
    ],
  },
] as const;

// ─── MAIN COMPONENT ─────────────────────────────────────────
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onSetRole }) => {
  const [step, setStep] = useState<Step>('hero');
  const [animating, setAnimating] = useState(false);
  const [activeRole, setActiveRole] = useState<0 | 1 | 2>(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(0);

  const goTo = (next: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 200);
  };

  // Touch/drag to switch between role cards
  const onTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const delta = dragStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) setActiveRole(prev => (delta > 0 ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0)) as 0 | 1 | 2);
  };
  const onMouseDown  = (e: React.MouseEvent) => { setDragging(true); dragStart.current = e.clientX; };
  const onMouseUp    = (e: React.MouseEvent) => {
    if (!dragging) return;
    setDragging(false);
    const delta = dragStart.current - e.clientX;
    if (Math.abs(delta) > 40) setActiveRole(prev => (delta > 0 ? Math.min(prev + 1, 2) : Math.max(prev - 1, 0)) as 0 | 1 | 2);
  };

  const role = ROLES[activeRole];

  // ── HERO ──────────────────────────────────────────────────
  if (step === 'hero') {
    return (
      <div className="min-h-screen bg-[#060a0e] flex flex-col overflow-hidden relative select-none"
        onMouseUp={onMouseUp} onMouseLeave={() => setDragging(false)}>

        {/* ── CSS ── */}
        <style>{`
          @keyframes sh-float {
            0%,100% { transform: translateY(0) rotate(-5deg); }
            50%      { transform: translateY(-10px) rotate(-5deg); }
          }
          @keyframes sh-glow {
            0%,100% { opacity: 0.5; transform: scale(1); }
            50%      { opacity: 0.8; transform: scale(1.08); }
          }
          @keyframes sh-scan {
            0%   { transform: translateY(-20px); opacity: 0; }
            15%  { opacity: 1; }
            85%  { opacity: 1; }
            100% { transform: translateY(320px); opacity: 0; }
          }
          @keyframes sh-in {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes sh-fade {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes sh-slide-card {
            from { opacity: 0; transform: translateY(40px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes sh-pip {
            0%,100% { transform: scaleX(1); }
            50%      { transform: scaleX(1.3); }
          }
          .sh-float  { animation: sh-float 3.5s ease-in-out infinite; }
          .sh-glow   { animation: sh-glow 3s ease-in-out infinite; }
          .sh-scan   { animation: sh-scan 5s ease-in-out infinite; }
          .sh-in-1   { animation: sh-in 0.6s cubic-bezier(0.16,1,0.3,1) both 0.05s; }
          .sh-in-2   { animation: sh-in 0.6s cubic-bezier(0.16,1,0.3,1) both 0.18s; }
          .sh-in-3   { animation: sh-in 0.6s cubic-bezier(0.16,1,0.3,1) both 0.30s; }
          .sh-in-4   { animation: sh-in 0.6s cubic-bezier(0.16,1,0.3,1) both 0.42s; }
          .sh-card   { animation: sh-slide-card 0.5s cubic-bezier(0.16,1,0.3,1) both; }
          .sh-fade   { animation: sh-fade 0.5s ease both 0.55s; }
          .sh-pip    { animation: sh-pip 1.8s ease-in-out infinite; }
          .sh-cursor { cursor: grab; }
          .sh-cursor:active { cursor: grabbing; }
        `}</style>

        {/* ── BG: field + glow ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* base dark vignette */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)',
          }} />
          {/* field SVG top */}
          <svg className="absolute inset-x-0 top-0 w-full" viewBox="0 0 390 280" preserveAspectRatio="xMidYMid slice"
            style={{ opacity: 0.13 }}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* vanishing-point perspective lines */}
            {[-120,-60,0,60,120].map((x,i) => (
              <line key={i} x1={195+x} y1={0} x2={195+x*4.5} y2={300} stroke="url(#wg)" strokeWidth="1" />
            ))}
            {[50,110,175,240].map((y,i) => (
              <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="url(#wg)" strokeWidth="0.8" />
            ))}
            {/* centre circle */}
            <ellipse cx="195" cy="72" rx="68" ry="24" fill="none" stroke="url(#wg)" strokeWidth="1.2" />
            <circle cx="195" cy="72" r="3.5" fill="#10B981" opacity="0.6" />
            {/* penalty box */}
            <rect x="118" y="0" width="154" height="44" fill="none" stroke="url(#wg)" strokeWidth="1" />
            <rect x="153" y="0" width="84" height="20" fill="none" stroke="url(#wg)" strokeWidth="0.7" />
          </svg>
          {/* scan line */}
          <div className="sh-scan absolute inset-x-0 h-px"
            style={{ top: 0, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
          {/* role-color glow bottom — changes with active role */}
          <div className="absolute bottom-0 inset-x-0 h-80 transition-all duration-500"
            style={{ background: `radial-gradient(ellipse 100% 60% at 50% 100%, ${role.color}18 0%, transparent 70%)` }} />
        </div>

        {/* ── BRAND top ── */}
        <div className="relative z-10 flex flex-col items-center pt-14 pb-2 sh-in-1">
          {/* floating logo */}
          <div className="relative mb-4">
            <div className="sh-glow absolute inset-0 rounded-[22px]"
              style={{ background: role.color, filter: 'blur(24px)', opacity: 0.35 }} />
            <div className="sh-float relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}99 100%)` }}>
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <circle cx="19" cy="19" r="16" stroke="white" strokeWidth="1.2" opacity="0.3" />
                <path d="M19 7 L22 13 L28 13 L24 18 L26 25 L19 21 L12 25 L14 18 L10 13 L16 13Z"
                  fill="none" stroke="white" strokeWidth="1.2" opacity="0.8" />
                <circle cx="19" cy="19" r="2.5" fill="white" opacity="0.9" />
              </svg>
            </div>
          </div>

          {/* wordmark */}
          <div className="relative">
            <h1 className="text-[52px] font-black italic tracking-[-0.04em] leading-none text-white"
              style={{ textShadow: `0 0 48px ${role.color}55` }}>
              SAHADA
            </h1>
            <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full transition-all duration-500"
              style={{ background: `linear-gradient(90deg, transparent, ${role.color}, transparent)` }} />
          </div>
          <p className="text-slate-600 text-[11px] font-bold tracking-[0.22em] uppercase mt-2">
            Maç Senin · <span style={{ color: role.color }}>Kontrol Sende</span>
          </p>
        </div>

        {/* ── STATS strip ── */}
        <div className="sh-in-2 relative z-10 flex justify-center mt-4 mb-6">
          <div className="flex items-center divide-x overflow-hidden rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)' }}>
            {[['10K+','Oyuncu'],['850+','Saha'],['42K+','Maç']].map(([v,l],i) => (
              <div key={i} className="flex flex-col items-center px-6 py-2.5"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-[17px] font-black text-white leading-none">{v}</span>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mt-0.5">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SWIPEABLE ROLE CARD ── */}
        <div className="sh-in-3 relative z-10 flex-1 flex flex-col px-5">

          {/* section label + pip indicators */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">Kim olduğunu seç</span>
            <div className="flex gap-1.5">
              {ROLES.map((r,i) => (
                <button key={i} onClick={() => setActiveRole(i as 0|1)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: activeRole === i ? 24 : 8,
                    background: activeRole === i ? r.color : 'rgba(255,255,255,0.12)',
                  }} />
              ))}
            </div>
          </div>

          {/* THE CARD — swipeable */}
          <div className="sh-card sh-cursor relative rounded-3xl overflow-hidden flex-1 min-h-[220px] max-h-[260px]"
            key={activeRole}
            style={{
              border: `1px solid ${role.colorBorder}`,
              background: `linear-gradient(145deg, ${role.colorDim} 0%, rgba(255,255,255,0.01) 100%)`,
              boxShadow: `0 0 60px ${role.color}18`,
            }}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            {/* corner glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: role.color, opacity: 0.12 }} />

            {/* top row */}
            <div className="relative p-5 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-3xl">{role.emoji}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}44` }}>
                      {role.badge}
                    </span>
                  </div>
                  <h2 className="text-[26px] font-black text-white leading-none tracking-tight">{role.title}</h2>
                  <p className="text-[11px] mt-1" style={{ color: `${role.color}99` }}>{role.subtitle}</p>
                </div>
                {/* swipe hint */}
                <div className="flex flex-col items-center gap-1 opacity-30 mt-1">
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                    <path d="M14 1l5 6-5 6M1 7h18" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[7px] text-white font-bold uppercase tracking-wider">Kaydır</span>
                </div>
              </div>
            </div>

            {/* perks */}
            <div className="relative px-5 pt-4 space-y-3">
              {role.perks.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base leading-none mt-0.5">{p.icon}</span>
                  <p className="text-slate-400 text-[11px] leading-snug flex-1">{p.text}</p>
                </div>
              ))}
            </div>

            {/* bottom CTA inside card */}
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4"
              style={{ background: `linear-gradient(to top, ${role.colorDim}, transparent)` }}>
              <button
                onClick={() => {
                  if (role.id === 'player') goTo('player_start');
                  else if (role.id === 'venue') goTo('venue_start');
                  else goTo('venue_staff_start');
                }}
                className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{
                  background: role.color,
                  color: role.id === 'venue_staff' ? 'white' : '#060a0e',
                  boxShadow: `0 0 24px ${role.color}44`,
                }}>
                <span>{role.id === 'player' ? 'Oyuncu Olarak Başla' : role.id === 'venue' ? 'Saha Sahibi Olarak Başla' : 'Personel Girişi Yap'}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── SECONDARY ACTIONS ── */}
          <div className="sh-in-4 mt-3 space-y-2">
            {/* invite code fast track */}
            <button onClick={() => onNavigate('phoneAuth')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 1h-5a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 004.5 13h5a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 009.5 1z"
                    stroke="#10B981" strokeWidth="1.2" />
                  <path d="M5.5 4.5h3M5.5 7h3M5.5 9.5h1.5" stroke="#10B981" strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-black" style={{ color: '#10B981' }}>Davet Koduyla Hızlı Gir</p>
                <p className="text-[10px] text-slate-700">Kaptan sana link attıysa buraya tıkla</p>
              </div>
              <span className="text-[8px] font-black px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                HIZLI
              </span>
            </button>

            {/* login */}
            <button onClick={() => onNavigate('login')}
              className="sh-fade w-full py-2.5 rounded-xl text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:text-slate-500"
              style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 1h5a1 1 0 011 1v8a1 1 0 01-1 1H4M1 6h7M5 3l3 3-3 3" stroke="currentColor"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Zaten hesabım var, giriş yap
            </button>
          </div>

          {/* terms */}
          <p className="sh-fade text-[8px] text-center text-slate-800 mt-3 pb-2">
            Devam ederek{' '}
            <span className="text-slate-600 underline cursor-pointer">Kullanım Koşulları</span> ve{' '}
            <span className="text-slate-600 underline cursor-pointer">Gizlilik Politikası</span>{"'"}nı kabul edersiniz.
          </p>
        </div>
      </div>
    );
  }

  // ── OYUNCU DETAY ─────────────────────────────────────────
  if (step === 'player_start') {
    return <PlayerStartScreen animating={animating} onBack={() => goTo('hero')} onNavigate={onNavigate} onSetRole={onSetRole} />;
  }

  // ── SAHA SAHİBİ DETAY ────────────────────────────────────
  if (step === 'venue_start') {
    return <VenueStartScreen animating={animating} onBack={() => goTo('hero')} onNavigate={onNavigate} />;
  }

  if (step === 'venue_staff_start') {
    return <VenueStaffStartScreen animating={animating} onBack={() => goTo('hero')} onNavigate={onNavigate} />;
  }

  return null;
};

// ─────────────────────────────────────────────────────────────
// OYUNCU ADIM SEÇİMİ
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
    const path = PLAYER_FIRST_STEPS[selected];
    onSetRole?.(path.role);
    onNavigate(path.cta);
  };

  return (
    <div className={`min-h-screen bg-[#060a0e] flex flex-col overflow-hidden relative transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'linear-gradient(to bottom, rgba(16,185,129,0.06), transparent)' }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8">
        {/* back */}
        <button onClick={onBack}
          className="flex items-center gap-2 mb-8 w-fit group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-slate-600 text-xs font-bold group-hover:text-slate-400 transition-colors">Geri</span>
        </button>

        {/* header */}
        <div className="mb-7">
          <span className="text-2xl">⚽</span>
          <h2 className="text-[28px] font-black text-white leading-none tracking-tight mt-2">
            Nasıl başlamak<br />
            <span style={{ color: '#10B981' }}>istiyorsun?</span>
          </h2>
          <p className="text-slate-600 text-[11px] mt-2">Giriş sonrası her şeye erişirsin — önce bir yol seç.</p>
        </div>

        {/* path cards */}
        <div className="space-y-2.5 flex-1">
          {PLAYER_FIRST_STEPS.map((path, i) => {
            const sel = selected === i;
            return (
              <button key={i} onClick={() => setSelected(i)}
                className="w-full text-left active:scale-[0.985] transition-all duration-150"
                style={{
                  borderRadius: 18,
                  border: sel
                    ? `1px solid ${path.highlight ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.3)'}`
                    : '1px solid rgba(255,255,255,0.06)',
                  background: sel
                    ? `linear-gradient(135deg, rgba(16,185,129,${path.highlight ? '0.13' : '0.07'}) 0%, transparent 100%)`
                    : 'rgba(255,255,255,0.02)',
                  boxShadow: sel && path.highlight ? '0 0 28px rgba(16,185,129,0.15)' : 'none',
                }}>
                <div className="flex items-center gap-3.5 p-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: sel ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)' }}>
                      {path.emoji}
                    </div>
                    {path.highlight && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: '#10B981' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 4h6M4.5 1.5l2.5 2.5-2.5 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-black text-sm ${sel ? 'text-white' : 'text-slate-400'}`}>{path.label}</p>
                      {path.badge && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: `${path.badgeColor}20`, color: path.badgeColor }}>
                          {path.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5 leading-snug">{path.desc}</p>
                  </div>
                  {/* radio */}
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      border: sel ? '2px solid #10B981' : '2px solid rgba(255,255,255,0.12)',
                      background: sel ? '#10B981' : 'transparent',
                    }}>
                    {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#060a0e' }} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* hint */}
        <div className="my-4 px-3.5 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            💡 <span className="text-slate-500 font-bold">Kod yok mu?</span> "Takım Kur"u seç → kendi grubunu oluştur, arkadaşlarını WhatsApp'tan davet et.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-2.5">
          <button onClick={proceed} disabled={selected === null}
            className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              background: selected !== null ? '#10B981' : 'rgba(255,255,255,0.04)',
              color: selected !== null ? '#060a0e' : 'rgba(255,255,255,0.15)',
              boxShadow: selected !== null ? '0 0 32px rgba(16,185,129,0.4)' : 'none',
              cursor: selected !== null ? 'pointer' : 'not-allowed',
            }}>
            Devam Et
            {selected !== null && (
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M3 8.5h11M9.5 3.5l5 5-5 5" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button onClick={() => onNavigate('login')}
            className="w-full py-3 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center transition-colors hover:text-slate-400"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            Hesabım var, giriş yap
          </button>
        </div>

        <p className="text-[8px] text-center text-slate-800 mt-4">
          Devam ederek{' '}
          <span className="text-slate-600 underline">Kullanım Koşulları</span> ve{' '}
          <span className="text-slate-600 underline">Gizlilik Politikası</span>{"'"}nı kabul edersiniz.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SAHA SAHİBİ DETAY
// ─────────────────────────────────────────────────────────────
const VenueStartScreen: React.FC<{
  animating: boolean;
  onBack: () => void;
  onNavigate: (s: ScreenName, p?: any) => void;
}> = ({ animating, onBack, onNavigate }) => (
  <div className={`min-h-screen bg-[#060a0e] flex flex-col overflow-hidden relative transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
    {/* BG */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
    </div>

    <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8 overflow-y-auto">
      {/* back */}
      <button onClick={onBack} className="flex items-center gap-2 mb-8 w-fit group">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-slate-600 text-xs font-bold group-hover:text-slate-400 transition-colors">Geri</span>
      </button>

      {/* header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏟️</span>
          <span className="text-[9px] font-black px-2 py-1 rounded-full"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}>
            İş Ortağı
          </span>
        </div>
        <h2 className="text-[28px] font-black text-white leading-none tracking-tight">
          Sahanı platforma<br />
          <span style={{ color: '#3B82F6' }}>bağla.</span>
        </h2>
        <p className="text-slate-600 text-[11px] mt-2">Tek hesap — tüm araçlar birlikte gelir, seçmen gerekmez.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[['850+','Aktif Saha'],['5 dk','Kurulum'],['%0','Komisyon']].map(([v,l],i) => (
          <div key={i} className="flex flex-col items-center py-3 rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <span className="text-[18px] font-black" style={{ color: '#60A5FA' }}>{v}</span>
            <span className="text-[8px] text-slate-600 uppercase font-bold tracking-wide mt-0.5">{l}</span>
          </div>
        ))}
      </div>

      {/* features */}
      <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.18em] mb-3">Pakete dahil — hepsi birden</p>
      <div className="space-y-2 flex-1">
        {VENUE_FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Icon name={f.icon} size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-none">{f.label}</p>
              <p className="text-slate-700 text-[10px] mt-0.5">{f.desc}</p>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1.5 4.5l2 2 3.5-3.5" stroke="#60A5FA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-5 space-y-2.5">
        <button onClick={() => onNavigate('login', { userType: 'venue_owner' })}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{ background: '#3B82F6', boxShadow: '0 0 32px rgba(59,130,246,0.4)' }}>
          Sahami Kaydet &amp; Başla
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M3 8.5h11M9.5 3.5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => onNavigate('login')}
          className="w-full py-3 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center transition-colors hover:text-slate-400"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          Hesabım var, giriş yap
        </button>
      </div>

      <p className="text-[8px] text-center text-slate-800 mt-4">
        Devam ederek{' '}
        <span className="text-slate-600 underline">Kullanım Koşulları</span> ve{' '}
        <span className="text-slate-600 underline">Gizlilik Politikası</span>{"'"}nı kabul edersiniz.
      </p>
    </div>
  </div>
);


// ─────────────────────────────────────────────────────────────
// SAHA PERSONELİ / MUHASEBE GİRİŞİ
// ─────────────────────────────────────────────────────────────
const VenueStaffStartScreen: React.FC<{
  animating: boolean;
  onBack: () => void;
  onNavigate: (s: ScreenName, p?: any) => void;
}> = ({ animating, onBack, onNavigate }) => (
  <div className={`min-h-screen bg-[#060a0e] flex flex-col overflow-hidden relative transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
    </div>

    <div className="relative z-10 flex flex-col flex-1 px-5 pt-12 pb-8 overflow-y-auto">
      <button onClick={onBack} className="flex items-center gap-2 mb-8 w-fit group">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-slate-600 text-xs font-bold group-hover:text-slate-400 transition-colors">Geri</span>
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👷</span>
          <span className="text-[9px] font-black px-2 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
            Personel
          </span>
        </div>
        <h2 className="text-[28px] font-black text-white leading-none tracking-tight">
          Sahada<br />
          <span style={{ color: '#8B5CF6' }}>Çalışıyorum.</span>
        </h2>
        <p className="text-slate-600 text-[11px] mt-2">Saha yöneticisi, personel veya muhasebe olarak giriş yapın.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[['3 Rol','Yönetici/Personel/Muhasebe'],['Anlık','Bildirimler'],['Güvenli','Rol bazlı erişim']].map(([v,l],i) => (
          <div key={i} className="flex flex-col items-center py-3 rounded-2xl"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <span className="text-[14px] font-black" style={{ color: '#A78BFA' }}>{v}</span>
            <span className="text-[8px] text-slate-600 uppercase font-bold tracking-wide mt-0.5 text-center">{l}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 flex-1">
        {[
          { icon: '📋', label: 'Rezervasyon Takibi', desc: 'Gelen rezervasyonları gör, onayla veya reddet' },
          { icon: '💳', label: 'EFT & Kasa', desc: 'Gelen ödemeleri ve kasa hareketlerini izle' },
          { icon: '📊', label: 'Gelir Raporları', desc: 'Muhasebe rolüyle finansal raporlara eriş' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <span className="text-sm">{f.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-none">{f.label}</p>
              <p className="text-slate-700 text-[10px] mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <button onClick={() => onNavigate('login', { userType: 'venue_staff' })}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{ background: '#8B5CF6', boxShadow: '0 0 32px rgba(139,92,246,0.4)' }}>
          Personel Girişi Yap
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M3 8.5h11M9.5 3.5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => onNavigate('login')}
          className="w-full py-3 rounded-xl text-slate-600 text-xs font-bold flex items-center justify-center transition-colors hover:text-slate-400"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          Hesabım var, giriş yap
        </button>
      </div>

      <p className="text-[8px] text-center text-slate-800 mt-4">
        Devam ederek{' '}
        <span className="text-slate-600 underline">Kullanım Koşulları</span> ve{' '}
        <span className="text-slate-600 underline">Gizlilik Politikası</span>{"'"}nı kabul edersiniz.
      </p>
    </div>
  </div>
);
