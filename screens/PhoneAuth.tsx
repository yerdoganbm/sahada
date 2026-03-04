import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface Props {
  pendingJoinCode?: string | null;
  onLoginSuccess: (user: Player) => void;
  onBack: () => void;
}

const MOCK_OTP = '1234';

export const PhoneAuth: React.FC<Props> = ({ pendingJoinCode, onLoginSuccess, onBack }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpInputRef.current?.focus(), 100);
  }, [step]);

  // Auto-submit when OTP reaches 4 digits
  useEffect(() => {
    if (otp.length === 4) handleVerifyOtp();
  }, [otp]);

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0,4)} ${digits.slice(4)}`;
    if (digits.length <= 10) return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7)}`;
    return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7,9)} ${digits.slice(9)}`;
  };

  const handleSendOtp = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Geçerli bir telefon numarası girin.'); return; }
    setSending(true); setError('');
    setTimeout(() => { setSending(false); setStep('otp'); setCountdown(60); }, 700);
  };

  const handleVerifyOtp = () => {
    if (otp !== MOCK_OTP) { setError('Kod hatalı. Demo: ' + MOCK_OTP); return; }
    setError('');
    // Skip name step if joining via invite (name will be captured in onboarding)
    if (pendingJoinCode) {
      finishLogin('Yeni Üye');
    } else {
      setStep('name');
    }
  };

  const finishLogin = (name: string) => {
    const mockUser: Player = {
      id: 'u_' + phone.replace(/\D/g, '').slice(-8),
      name: name || 'Yeni Üye',
      phone: phone.replace(/\D/g, ''),
      role: 'member',
      tier: 'free',
      avatar: `https://i.pravatar.cc/150?u=${phone}`,
      position: 'MID',
      goals: 0, assists: 0, matchesPlayed: 0,
      rating: 0, yellowCards: 0, redCards: 0,
      joinDate: new Date().toISOString(),
      isActive: true,
    } as any;
    onLoginSuccess(mockUser);
  };

  const copyDemo = () => {
    navigator.clipboard?.writeText(MOCK_OTP);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ── STEP INDICATORS ──────────────────────────────────────────────────
  const steps = pendingJoinCode ? ['phone', 'otp'] : ['phone', 'otp', 'name'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-white transition-colors mb-6">
          <Icon name="arrow_back" size={16} /> Geri
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= stepIdx ? 'bg-primary w-8' : 'bg-white/10 w-6'}`} />
          ))}
        </div>

        {pendingJoinCode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-4 w-fit">
            <Icon name="link" size={12} className="text-primary" />
            <span className="text-primary text-xs font-bold">Davet kodu: {pendingJoinCode}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 max-w-sm mx-auto w-full">

        {/* ── PHONE STEP ── */}
        {step === 'phone' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Telefon numaranı gir</h2>
              <p className="text-slate-500 text-sm">Sana doğrulama kodu göndereceğiz</p>
            </div>

            <div>
              <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-primary transition-all">
                <span className="text-slate-500 text-sm font-bold">🇹🇷</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(formatPhone(e.target.value)); setError(''); }}
                  placeholder="0532 000 00 00"
                  className="flex-1 bg-transparent text-white text-base focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            <button
              onClick={handleSendOtp}
              disabled={sending || phone.replace(/\D/g, '').length < 10}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {sending
                ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Gönderiliyor…</>
                : <><span>Kod Gönder</span><Icon name="arrow_forward" size={16} /></>
              }
            </button>

            <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3 text-center">
              <p className="text-blue-400 text-xs">🚀 Demo — herhangi bir numara girin</p>
            </div>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Kodu gir</h2>
              <p className="text-slate-500 text-sm"><span className="text-white font-bold">{phone}</span> numarasına gönderildi</p>
            </div>

            {/* Demo helper */}
            <div className="flex items-center justify-between p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
              <span className="text-yellow-300 text-sm">Demo kodu: <strong>{MOCK_OTP}</strong></span>
              <button onClick={copyDemo} className="text-xs text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-lg font-bold">
                {copied ? '✓' : 'Kopyala'}
              </button>
            </div>

            {/* 4-digit OTP input */}
            <div>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="••••"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-4 text-white text-4xl text-center font-black tracking-[0.6em] focus:outline-none focus:border-primary transition-all"
              />
              {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 4}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              Doğrula →
            </button>

            <div className="flex items-center justify-between text-sm">
              <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-slate-500 hover:text-white transition-colors">
                ← Numarayı değiştir
              </button>
              {countdown > 0
                ? <span className="text-slate-600">{countdown}s</span>
                : <button onClick={handleSendOtp} className="text-primary font-bold">Yeniden gönder</button>
              }
            </div>
          </div>
        )}

        {/* ── NAME STEP (only without join code) ── */}
        {step === 'name' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Adını gir 👋</h2>
              <p className="text-slate-500 text-sm">Diğer oyuncular seni bu isimle tanıyacak</p>
            </div>

            <div>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-primary transition-all"
                onKeyDown={e => e.key === 'Enter' && fullName.trim() && finishLogin(fullName)}
                autoFocus
              />
            </div>

            <button
              onClick={() => finishLogin(fullName)}
              disabled={!fullName.trim()}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              Başla →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
