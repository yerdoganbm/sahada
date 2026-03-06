/**
 * LoginScreen — Ultra-premium single auth flow
 * Handles: phone → 4-digit OTP → (name for new users)
 * Contexts: player / captain / venue_owner / join-code
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Props ─────────────────────────────────────────────────────────
interface LoginScreenProps {
  onLogin: (userId: string, isNewTeam?: boolean) => void;
  onRegisterVenueOwner?: (phone: string) => void;
  onNavigate?: (screen: string, params?: any) => void;
  userType?: 'player' | 'venue_owner' | 'venue_staff' | null;
  pendingJoinCode?: string | null;
  pendingRole?: 'captain' | 'member' | null;
}

// ─── Constants ─────────────────────────────────────────────────────
const DEMO_OTP = '1234';
const OTP_LEN = 4;

// Demo users quick-access
const DEMO_USERS = [
  { phone: '5000000001', label: 'Admin',           icon: '🛡',  role: 'admin' },
  { phone: '5000000007', label: 'Kaptan Ali',      icon: '🏆',  role: 'captain' },
  { phone: '5000000002', label: 'Üye Ahmet',       icon: '⚽',  role: 'member' },
  { phone: '5000000099', label: 'Saha Sahibi',     icon: '🏟',  role: 'venue_owner' },
  { phone: '5000000098', label: 'Saha Personeli',  icon: '👷',  role: 'venue_staff' },
  { phone: '5000000097', label: 'Saha Muhasebeci', icon: '📊',  role: 'venue_accountant' },
];

// ─── Accent configs ────────────────────────────────────────────────
const ACCENTS = {
  green:  { primary: '#10B981', dim: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: '0 0 32px rgba(16,185,129,0.4)' },
  yellow: { primary: '#F59E0B', dim: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  glow: '0 0 32px rgba(245,158,11,0.4)' },
  blue:   { primary: '#3B82F6', dim: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  glow: '0 0 32px rgba(59,130,246,0.4)' },
};

// ─── SVG icons (inline, no deps) ──────────────────────────────────
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3.5 9h11M10 4.5l4.5 4.5L10 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ChevLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6.5 11l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegisterVenueOwner,
  onNavigate,
  userType = null,
  pendingJoinCode,
  pendingRole,
}) => {
  const isVenue      = userType === 'venue_owner';
  const isVenueStaff = userType === 'venue_staff';
  const isAnyVenue   = isVenue || isVenueStaff;
  const isCaptain    = pendingRole === 'captain';
  const hasCode      = !!pendingJoinCode;

  // Accent color
  const accentKey = isAnyVenue ? 'blue' : isCaptain ? 'yellow' : 'green';
  const ac = ACCENTS[accentKey];

  // Steps: phone → otp → name (skip if code or venue onboarding)
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [shake, setShake] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LEN).fill(null));
  const nameRef = useRef<HTMLInputElement>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 150);
    if (step === 'name') setTimeout(() => nameRef.current?.focus(), 150);
  }, [step]);

  const rawPhone = phone.replace(/\D/g, '');
  const phoneValid = rawPhone.length >= 10;

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
    if (d.length <= 9) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}`;
  };

  // ── Send OTP ──────────────────────────────────────────────────────
  const handleSend = () => {
    if (!phoneValid) { setError('Geçerli bir numara gir'); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); setStep('otp'); setCountdown(59); }, 800);
  };

  // ── OTP input handlers ────────────────────────────────────────────
  const handleOtpChange = useCallback((idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = d;
    setOtp(next);
    setError('');
    if (d && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus();
    if (d && idx === OTP_LEN - 1 && next.every(Boolean)) setTimeout(() => doVerify(next), 80);
  }, [otp]);

  const handleOtpKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (otp[idx]) {
        const n = [...otp]; n[idx] = ''; setOtp(n);
      } else if (idx > 0) {
        const n = [...otp]; n[idx - 1] = ''; setOtp(n);
        otpRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!txt) return;
    const next = Array(OTP_LEN).fill('');
    txt.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const focusIdx = Math.min(txt.length, OTP_LEN - 1);
    otpRefs.current[focusIdx]?.focus();
    if (txt.length === OTP_LEN) setTimeout(() => doVerify(next), 80);
  };

  // ── Verify OTP ────────────────────────────────────────────────────
  const doVerify = (arr: string[]) => {
    const code = arr.join('');
    if (code.length < OTP_LEN) return;
    setLoading(true); setError('');
    setTimeout(() => {
      setLoading(false);
      if (code !== DEMO_OTP) {
        setError(`Hatalı kod — Demo: ${DEMO_OTP}`);
        setShake(s => s + 1);
        setOtp(Array(OTP_LEN).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 60);
        return;
      }
      setVerified(true);
      setTimeout(() => {
        if (isAnyVenue) { handleVenueRoute(); return; }
        if (hasCode) { finishLogin('Yeni Üye'); return; }
        // check if known demo user
        const known = DEMO_USERS.find(u => rawPhone.endsWith(u.phone));
        if (known) { finishLogin(known.label); return; }
        setStep('name');
      }, 550);
    }, 900);
  };

  const handleVenueRoute = () => {
    const known = DEMO_USERS.find(u => rawPhone.endsWith(u.phone));
    // Known demo users → direct login (existing account)
    if (known?.role === 'venue_owner')      { onLogin('venue_owner_1');      return; }
    if (known?.role === 'venue_staff')      { onLogin('venue_staff_1');      return; }
    if (known?.role === 'venue_accountant') { onLogin('venue_accountant_1'); return; }
    // Non-demo staff → dashboard
    if (isVenueStaff) { onLogin('venue_staff_' + rawPhone); return; }
    // Non-demo owner → new registration onboarding
    if (onRegisterVenueOwner) {
      onRegisterVenueOwner(rawPhone.slice(-10));
    } else {
      onLogin('venue_owner_' + rawPhone.slice(-10));
    }
  };

  // ── Finish login (resolve userId from phone) ──────────────────────
  const finishLogin = (displayName?: string) => {
    // Demo user mapping
    if (rawPhone === '5000000001') { onLogin('1'); return; }
    if (rawPhone === '5000000007') { onLogin('7'); return; }
    if (rawPhone === '5000000002') { onLogin('2'); return; }
    if (rawPhone === '5000000099') { onLogin('venue_owner_1'); return; }
    if (rawPhone === '5000000098') { onLogin('venue_staff_1'); return; }
    if (rawPhone === '5000000097') { onLogin('venue_accountant_1'); return; }
    // New user — onLogin with name so the app can register them
    onLogin('new_player_' + rawPhone, undefined);
  };

  // ── Quick demo fill ───────────────────────────────────────────────
  const quickFill = (userPhone: string) => {
    setPhone(fmt(userPhone));
    setShowDemo(false);
    setStep('phone');
    setTimeout(() => {
      setLoading(true); setError('');
      setTimeout(() => {
        setLoading(false); setStep('otp'); setCountdown(59);
        setTimeout(() => {
          const d = DEMO_OTP.split('');
          setOtp(d);
          setTimeout(() => doVerify(d), 80);
        }, 200);
      }, 600);
    }, 100);
  };

  const otpFull = otp.every(Boolean);
  const totalSteps = hasCode || isAnyVenue ? 2 : 3;
  const stepIdx = ['phone', 'otp', 'name'].indexOf(step);

  // ── Context badge ─────────────────────────────────────────────────
  const badge = hasCode
    ? { emoji: '🔗', text: `Kod: ${pendingJoinCode}`, col: '#10B981' }
    : isCaptain
      ? { emoji: '🏆', text: 'Kaptan kaydı',              col: '#F59E0B' }
      : isVenueStaff
        ? { emoji: '👷', text: 'Personel / Muhasebe girişi', col: '#8B5CF6' }
        : isVenue
          ? { emoji: '🏟', text: 'Saha sahibi girişi',    col: '#3B82F6' }
          : null;

  return (
    <>
      <style>{`
        @keyframes ls-up    { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none} }
        @keyframes ls-shake { 0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}35%{transform:translateX(10px)}55%{transform:translateX(-6px)}75%{transform:translateX(6px)} }
        @keyframes ls-pop   { 0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1} }
        @keyframes ls-scan  { 0%{transform:translateY(-4px);opacity:0}20%,80%{opacity:0.7}100%{transform:translateY(70px);opacity:0} }
        @keyframes ls-pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        .ls-1 { animation: ls-up 0.5s cubic-bezier(0.16,1,0.3,1) both 0s; }
        .ls-2 { animation: ls-up 0.5s cubic-bezier(0.16,1,0.3,1) both 0.07s; }
        .ls-3 { animation: ls-up 0.5s cubic-bezier(0.16,1,0.3,1) both 0.14s; }
        .ls-4 { animation: ls-up 0.5s cubic-bezier(0.16,1,0.3,1) both 0.22s; }
        .ls-5 { animation: ls-up 0.5s cubic-bezier(0.16,1,0.3,1) both 0.30s; }
        .ls-scan { animation: ls-scan 3s ease-in-out infinite; }
        .ls-cursor:focus { outline: none; }
      `}</style>

      <div className="fixed inset-0 z-[60] flex flex-col" style={{ height: '100dvh', background: 'linear-gradient(180deg, #07090e 0%, #060a0e 100%)' }}>

        {/* ── Ambient glow ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: ac.primary }} />
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10"
            style={{ background: `linear-gradient(to top, ${ac.primary}30, transparent)` }} />
          {/* subtle grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" preserveAspectRatio="none">
            {Array.from({length: 8}).map((_,i) => (
              <line key={i} x1={`${i*14.28}%`} y1="0" x2={`${i*14.28}%`} y2="100%" stroke="white" strokeWidth="0.5"/>
            ))}
            {Array.from({length: 12}).map((_,i) => (
              <line key={i} x1="0" y1={`${i*9}%`} x2="100%" y2={`${i*9}%`} stroke="white" strokeWidth="0.5"/>
            ))}
          </svg>
        </div>

        {/* ── Header ── */}
        <div className="relative z-10 flex-shrink-0 px-5 pt-14">
          <div className="ls-1 flex items-center justify-between mb-7">
            {/* back */}
            <button
              onClick={() => step === 'otp' ? (setStep('phone'), setOtp(Array(OTP_LEN).fill('')), setVerified(false)) : onNavigate?.('welcome')}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-[0.9]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              <ChevLeft />
            </button>

            {/* progress pills */}
            <div className="flex items-center gap-1.5">
              {Array.from({length: totalSteps}).map((_,i) => (
                <div key={i} className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width: i === stepIdx ? 24 : 8, background: i <= stepIdx ? ac.primary : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            {/* step counter */}
            <div className="w-10 flex justify-end">
              <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>{stepIdx+1}/{totalSteps}</span>
            </div>
          </div>

          {/* context badge */}
          {badge && (
            <div className="ls-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: `${badge.col}15`, border: `1px solid ${badge.col}40` }}>
              <span className="text-[13px]">{badge.emoji}</span>
              <span className="text-[11px] font-black" style={{ color: badge.col }}>{badge.text}</span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex-1 flex flex-col px-5 pb-10 min-h-0 overflow-y-auto">

          {/* ════════════════════════════════════════════════════════
              STEP: PHONE
          ════════════════════════════════════════════════════════ */}
          {step === 'phone' && (
            <div className="flex flex-col flex-1">
              {/* headline */}
              <div className="ls-2 mb-10">
                <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight mb-3">
                  {isVenue ? 'Sahanı\nEkle' : hasCode ? 'Takıma\nKatıl' : isCaptain ? 'Kaptan\nKaydı' : 'Hoş\nGeldin'}
                </h1>
                <p className="text-slate-500 text-[14px] leading-relaxed">
                  {isVenue
                    ? 'Saha sahibi girişi — telefon numaranı gir'
                    : hasCode
                      ? 'Giriş yap ya da kaydol, ardından takıma katıl'
                      : 'Telefon numaranı gir, giriş ya da kayıt olalım'}
                </p>
              </div>

              {/* phone input */}
              <div className="ls-3 mb-4">
                <div
                  className="flex items-center gap-3 px-4 rounded-2xl transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${phoneValid ? ac.primary : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: phoneValid ? `0 0 20px ${ac.primary}20` : 'none',
                    height: 62,
                  }}>
                  <span className="text-xl flex-shrink-0">🇹🇷</span>
                  <span className="text-white/40 text-[15px] font-black flex-shrink-0">+90</span>
                  <div className="w-px h-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(fmt(e.target.value)); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && phoneValid && handleSend()}
                    placeholder="532 000 00 00"
                    autoFocus
                    className="flex-1 bg-transparent text-white text-[19px] font-black focus:outline-none placeholder-slate-800 tracking-wider"
                  />
                  {phoneValid && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: ac.primary }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#060a0e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                {error && (
                  <p className="text-red-400 text-[11px] font-bold mt-2 ml-1">{error}</p>
                )}
              </div>

              {/* demo info */}
              <div className="ls-4 mb-6 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <p className="text-blue-400 text-[11px] font-bold text-center">Demo — herhangi bir numara (min 10 hane)</p>
              </div>

              {/* demo users quick-select */}
              <div className="ls-4 mb-6">
                <button
                  onClick={() => setShowDemo(d => !d)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Hızlı Demo Girişi</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className="transition-transform duration-200"
                    style={{ transform: showDemo ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showDemo && (
                  <div className="mt-1 rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {DEMO_USERS.map(u => (
                      <button key={u.phone}
                        onClick={() => quickFill(u.phone)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0">
                        <span className="text-base w-7 text-center">{u.icon}</span>
                        <div className="flex-1">
                          <p className="text-white text-[12px] font-black">{u.label}</p>
                          <p className="text-slate-700 text-[10px]">+90 {u.phone}</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          1 tık
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-4" />

              {/* CTA */}
              <button
                onClick={handleSend}
                disabled={loading || !phoneValid}
                className="ls-5 w-full flex items-center justify-center gap-2.5 font-black text-[16px] rounded-2xl transition-all active:scale-[0.97] flex-shrink-0 sticky bottom-4"
                style={{
                  height: 58,
                  background: phoneValid ? ac.primary : 'rgba(255,255,255,0.06)',
                  color: phoneValid ? '#060a0e' : 'rgba(255,255,255,0.2)',
                  boxShadow: phoneValid ? ac.glow : 'none',
                  cursor: phoneValid ? 'pointer' : 'not-allowed',
                }}>
                {loading
                  ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>Gönderiliyor…</>
                  : <><span>Kod Gönder</span><ArrowRight /></>}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP: OTP
          ════════════════════════════════════════════════════════ */}
          {step === 'otp' && (
            <div className="flex flex-col flex-1">
              {/* headline with scan animation */}
              <div className="ls-2 mb-10">
                <div className="relative w-16 h-16 mb-5">
                  <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                    style={{ background: ac.dim, border: `1.5px solid ${ac.border}` }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="6" y="4" width="16" height="20" rx="2.5" stroke={ac.primary} strokeWidth="1.5"/>
                      <path d="M10 10h8M10 14h6M10 18h4" stroke={ac.primary} strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="ls-scan absolute inset-x-2 h-[2px] rounded-full top-2"
                    style={{ background: `linear-gradient(90deg, transparent, ${ac.primary}, transparent)` }} />
                </div>
                <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight mb-2">
                  {verified ? '✓ Doğrulandı' : 'Kodu Gir'}
                </h1>
                <p className="text-slate-500 text-sm">
                  <span className="text-white font-bold">{phone}</span>{' '}
                  numarasına {OTP_LEN} haneli SMS gönderildi
                </p>
              </div>

              {/* OTP input grid */}
              <div
                key={shake}
                className="ls-3 flex gap-3 mb-5"
                style={{ animation: shake > 0 ? 'ls-shake 0.5s ease' : 'none' }}
                onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <div key={i} className="flex-1 relative">
                    <input
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      onFocus={e => e.target.select()}
                      disabled={loading || verified}
                      className="ls-cursor w-full text-center font-black rounded-2xl transition-all duration-200"
                      style={{
                        height: 76,
                        fontSize: 30,
                        background: verified ? `${ac.primary}18` : d ? `${ac.primary}10` : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${verified ? ac.primary : d ? ac.primary : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: d ? `0 0 20px ${ac.primary}25` : 'none',
                        color: verified ? ac.primary : 'white',
                        caretColor: ac.primary,
                        transform: d ? 'scale(1.04)' : 'scale(1)',
                      }}
                    />
                    {loading && d && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: ac.primary }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="ls-2 flex items-center gap-2 px-3.5 py-3 rounded-xl mb-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#EF4444" strokeWidth="1.3"/>
                    <path d="M7 4.5v3M7 9h.01" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <p className="text-red-400 text-[12px] font-bold">{error}</p>
                </div>
              )}

              {/* resend + change */}
              <div className="ls-4 flex items-center justify-between mb-5">
                <button
                  onClick={() => { setStep('phone'); setOtp(Array(OTP_LEN).fill('')); setVerified(false); setError(''); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-white transition-colors">
                  <ChevLeft /><span>Değiştir</span>
                </button>
                {countdown > 0
                  ? <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{countdown}s bekle</span>
                  : <button onClick={handleSend} className="text-[12px] font-black" style={{ color: ac.primary }}>Tekrar gönder</button>}
              </div>

              {/* Demo shortcut */}
              <button
                onClick={() => { const d = DEMO_OTP.split(''); setOtp(d); setError(''); setTimeout(() => doVerify(d), 80); }}
                className="ls-4 w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] mb-3"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <span className="text-yellow-400 text-[12px] font-black">⚡ Demo kod: {DEMO_OTP} — otomatik doldur</span>
              </button>

              <div className="flex-1 min-h-4" />

              {/* verify CTA */}
              <button
                onClick={() => doVerify(otp)}
                disabled={!otpFull || loading || verified}
                className="ls-5 w-full flex items-center justify-center gap-2.5 font-black text-[16px] rounded-2xl transition-all active:scale-[0.97] flex-shrink-0 sticky bottom-4"
                style={{
                  height: 58,
                  background: verified ? '#10B981' : (otpFull ? ac.primary : 'rgba(255,255,255,0.06)'),
                  color: otpFull ? '#060a0e' : 'rgba(255,255,255,0.2)',
                  boxShadow: otpFull ? ac.glow : 'none',
                  cursor: otpFull ? 'pointer' : 'not-allowed',
                }}>
                {verified
                  ? <><CheckCircle /><span>Doğrulandı!</span></>
                  : loading
                    ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>Kontrol ediliyor…</>
                    : <><span>Doğrula {hasCode ? '& Katıl' : '& Giriş Yap'}</span><ArrowRight /></>}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP: NAME (new users only)
          ════════════════════════════════════════════════════════ */}
          {step === 'name' && (
            <div className="flex flex-col flex-1">
              <div className="ls-2 mb-10">
                <div className="text-5xl mb-5">👋</div>
                <h1 className="text-[34px] font-black text-white leading-[1.1] tracking-tight mb-3">
                  Adını gir
                </h1>
                <p className="text-slate-500 text-sm">
                  {isCaptain ? 'Takım üyeleri seni bu isimle tanıyacak' : 'Diğer oyuncular seni bu isimle görecek'}
                </p>
              </div>

              <div className="ls-3 mb-3">
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isCaptain ? 'Kaptan adı...' : 'Ad Soyad'}
                  onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && finishLogin(name)}
                  className="w-full px-5 rounded-2xl text-white text-[20px] font-black focus:outline-none transition-all"
                  style={{
                    height: 62,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${name.trim().length >= 2 ? ac.primary : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: name.trim().length >= 2 ? `0 0 20px ${ac.primary}20` : 'none',
                    caretColor: ac.primary,
                  }}
                />
              </div>

              {/* fun emoji decorations */}
              <div className="ls-4 flex gap-2 flex-wrap mb-6">
                {['⚽','🏃','🔥','💪','⚡','🎯'].map(e => (
                  <button key={e} onClick={() => setName(n => n + e)}
                    className="w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all active:scale-[0.88]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {e}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-4" />

              <button
                onClick={() => finishLogin(name)}
                disabled={name.trim().length < 2}
                className="ls-5 w-full flex items-center justify-center gap-2.5 font-black text-[16px] rounded-2xl transition-all active:scale-[0.97] flex-shrink-0 sticky bottom-4"
                style={{
                  height: 58,
                  background: name.trim().length >= 2 ? ac.primary : 'rgba(255,255,255,0.06)',
                  color: name.trim().length >= 2 ? '#060a0e' : 'rgba(255,255,255,0.2)',
                  boxShadow: name.trim().length >= 2 ? ac.glow : 'none',
                  cursor: name.trim().length >= 2 ? 'pointer' : 'not-allowed',
                }}>
                <span>Sahada'ya Başla</span>
                <ArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
