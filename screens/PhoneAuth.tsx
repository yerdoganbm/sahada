import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Player } from '../types';

interface Props {
  pendingJoinCode?: string | null;
  onLoginSuccess: (user: Player) => void;
  onBack: () => void;
}

// Mock OTP logic
const MOCK_OTP = '1234';

export const PhoneAuth: React.FC<Props> = ({ pendingJoinCode, onLoginSuccess, onBack }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const handleSendOtp = () => {
    if (phone.replace(/\D/g, '').length < 10) { setError('Geçerli bir telefon numarası girin.'); return; }
    setSending(true);
    setError('');
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      setCountdown(60);
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otp !== MOCK_OTP) { setError('Kod hatalı. Demo: ' + MOCK_OTP); return; }
    // Create a mock player for new user
    const mockUser: Player = {
      id: 'u_phone_' + Date.now(),
      name: 'Yeni Üye',
      phone,
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Telefon ile Giriş</h1>
            {pendingJoinCode && <p className="text-xs text-primary">Takıma katılmak için giriş yap</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
        {step === 'phone' ? (
          <div className="w-full space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Icon name="smartphone" size={32} className="text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-2xl mb-1">Telefon Numaranı Gir</h2>
              <p className="text-slate-400 text-sm">Sana doğrulama kodu göndereceğiz</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Telefon</label>
              <input
                type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
                placeholder="0532 000 00 00"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-primary transition-all"
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleSendOtp} disabled={sending || phone.length < 10}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
              {sending ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Gönderiliyor…</> : 'Kod Gönder'}
            </button>
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-3">
              <p className="text-[10px] text-blue-300 text-center">🚀 Demo modu aktif — herhangi bir numara girin</p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
              <Icon name="verified" size={32} className="text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-2xl mb-1">Kodu Gir</h2>
              <p className="text-slate-400 text-sm">{phone} numarasına gönderildi</p>
            </div>
            {/* Demo OTP helper */}
            <div className="flex items-center justify-between p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-2xl">
              <p className="text-yellow-300 text-sm font-bold">Demo kodu: <span className="font-black">{MOCK_OTP}</span></p>
              <button onClick={copyDemo} className="text-xs text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-lg font-bold">
                {copied ? '✓ Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Doğrulama Kodu</label>
              <input
                type="text" maxLength={6} value={otp} onChange={e => { setOtp(e.target.value); setError(''); }}
                placeholder="1234" className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-3xl text-center font-black tracking-[0.5em] focus:outline-none focus:border-primary transition-all"
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleVerifyOtp} disabled={otp.length < 4}
              className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40">
              Doğrula ve Giriş Yap
            </button>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep('phone')} className="text-slate-400 text-sm">← Numarayı değiştir</button>
              {countdown > 0
                ? <p className="text-slate-500 text-sm">{countdown}s yeniden gönder</p>
                : <button onClick={handleSendOtp} className="text-primary text-sm font-bold">Yeniden gönder</button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
