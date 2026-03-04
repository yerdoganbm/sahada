import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';

interface Props {
  pendingJoinCode?: string | null;
  pendingRole?: 'captain' | 'member' | null;
  onLoginSuccess: (user: Player) => void;
  onBack: () => void;
}

const MOCK_OTP = '1234';

export const PhoneAuth: React.FC<Props> = ({ pendingJoinCode, pendingRole, onLoginSuccess, onBack }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => ref0.current?.focus(), 150);
  }, [step]);

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
    if (d.length <= 10) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}`;
  };

  const handleSendOtp = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Geçerli bir telefon numarası girin.'); return; }
    setSending(true); setError('');
    setTimeout(() => { setSending(false); setStep('otp'); setCountdown(59); }, 600);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!val.match(/^\d?$/)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 3) inputRefs[idx + 1].current?.focus();
    if (idx === 3 && val && next.join('').length === 4) {
      setTimeout(() => handleVerifyOtp(next), 80);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs[idx - 1].current?.focus();
  };

  const handleVerifyOtp = (otpArr: string[] = otp) => {
    const code = otpArr.join('');
    if (code !== MOCK_OTP) { setError('Kod hatalı. Demo: ' + MOCK_OTP); return; }
    setError('');
    if (pendingJoinCode) finishLogin('Yeni Üye');
    else setStep('name');
  };

  const finishLogin = (name: string) => {
    const digits = phone.replace(/\D/g, '');
    onLoginSuccess({
      id: 'u_' + digits.slice(-8),
      name: name || 'Yeni Üye',
      phone: digits,
      role: pendingRole === 'captain' ? ('captain' as any) : 'member',
      tier: 'free',
      avatar: `https://i.pravatar.cc/150?u=${digits}`,
      position: 'MID',
      rating: 0, reliability: 80, goals: 0, assists: 0, matchesPlayed: 0,
      joinDate: new Date().toISOString(), isActive: true,
    } as any);
  };

  const fillDemo = () => {
    const d = ['1','2','3','4'];
    setOtp(d); setError('');
    setTimeout(() => handleVerifyOtp(d), 80);
  };

  const totalSteps = pendingJoinCode ? 2 : 3;
  const stepIdx = (pendingJoinCode ? ['phone','otp'] : ['phone','otp','name']).indexOf(step);
  const phoneDigits = phone.replace(/\D/g, '');

  return (
    <div className="h-screen bg-[#060a0e] flex flex-col overflow-hidden">
      {/* Header — fixed height */}
      <div className="flex-shrink-0 px-5 pt-12 pb-4">
        <button onClick={onBack}
          className="flex items-center gap-2 mb-6 group"
          style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700 }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M8.5 1.5L3.5 6.5l5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Geri
        </button>

        {/* Progress */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i <= stepIdx ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {pendingJoinCode && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-3"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 800 }}>🔗 Davet kodu: {pendingJoinCode}</span>
          </div>
        )}
        {pendingRole === 'captain' && !pendingJoinCode && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-3"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-yellow-300" style={{ fontSize: 10, fontWeight: 800 }}>🏆 Kaptan olarak kayıt</span>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">

        {step === 'phone' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[26px] font-black text-white leading-tight mb-1">Telefon numaranı gir</h2>
              <p className="text-sm text-slate-500">Doğrulama kodu göndereceğiz</p>
            </div>

            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <span className="text-lg">🇹🇷</span>
              <input type="tel" value={phone}
                onChange={e => { setPhone(formatPhone(e.target.value)); setError(''); }}
                placeholder="0532 000 00 00"
                className="flex-1 bg-transparent text-white text-[17px] font-bold focus:outline-none placeholder-slate-700"
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()} autoFocus />
            </div>
            {error && <p className="text-red-400 text-xs">⚠ {error}</p>}

            <div className="px-4 py-3 rounded-xl text-center"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <p className="text-blue-400 text-xs">🚀 Demo modu — herhangi bir numara girin</p>
            </div>

            <button onClick={handleSendOtp}
              disabled={sending || phoneDigits.length < 10}
              className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: phoneDigits.length >= 10 ? '#10B981' : 'rgba(255,255,255,0.06)',
                color: phoneDigits.length >= 10 ? '#060a0e' : 'rgba(255,255,255,0.2)',
                boxShadow: phoneDigits.length >= 10 ? '0 0 24px rgba(16,185,129,0.35)' : 'none',
                cursor: phoneDigits.length >= 10 ? 'pointer' : 'not-allowed',
              }}>
              {sending ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Gönderiliyor…</> : 'Kod Gönder'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[26px] font-black text-white leading-tight mb-1">SMS kodunu gir</h2>
              <p className="text-sm text-slate-500"><span className="text-white font-bold">{phone}</span> numarasına gönderildi</p>
            </div>

            {/* 4-box OTP */}
            <div className="flex gap-3 justify-center">
              {otp.map((digit, i) => (
                <input key={i} ref={inputRefs[i]}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-[68px] h-[68px] rounded-2xl text-white text-2xl font-black text-center focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: digit ? '2px solid #10B981' : '1.5px solid rgba(255,255,255,0.12)',
                    boxShadow: digit ? '0 0 16px rgba(16,185,129,0.2)' : 'none',
                  }}
                  onFocus={e => e.target.select()} />
              ))}
            </div>
            {error && <p className="text-red-400 text-xs text-center">⚠ {error}</p>}

            <div className="flex items-center justify-between">
              <button onClick={() => { setStep('phone'); setOtp(['','','','']); setError(''); }}
                className="text-slate-600 text-xs font-bold hover:text-white transition-colors">
                ← Numarayı değiştir
              </button>
              {countdown > 0
                ? <span className="text-slate-700 text-xs font-bold">{countdown}s</span>
                : <button onClick={handleSendOtp} className="text-xs font-black" style={{ color: '#10B981' }}>Yeniden gönder</button>
              }
            </div>

            <button onClick={fillDemo}
              className="w-full py-3 rounded-xl flex items-center justify-center transition-all active:scale-[0.98]"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <span className="text-yellow-400 text-xs font-black">⚡ Demo: 1 2 3 4 — hızlı giriş</span>
            </button>

            <button onClick={() => handleVerifyOtp()} disabled={otp.join('').length < 4}
              className="w-full py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.97]"
              style={{
                background: otp.join('').length === 4 ? '#10B981' : 'rgba(255,255,255,0.06)',
                color: otp.join('').length === 4 ? '#060a0e' : 'rgba(255,255,255,0.2)',
                boxShadow: otp.join('').length === 4 ? '0 0 24px rgba(16,185,129,0.35)' : 'none',
                cursor: otp.join('').length === 4 ? 'pointer' : 'not-allowed',
              }}>
              Doğrula & Giriş Yap
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[26px] font-black text-white leading-tight mb-1">Adını gir 👋</h2>
              <p className="text-sm text-slate-500">Diğer oyuncular seni bu isimle tanıyacak</p>
            </div>

            <input value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full px-4 py-4 rounded-2xl text-white text-[17px] font-bold focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}
              onKeyDown={e => e.key === 'Enter' && fullName.trim() && finishLogin(fullName)}
              autoFocus />

            <button onClick={() => finishLogin(fullName)} disabled={!fullName.trim()}
              className="w-full py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.97]"
              style={{
                background: fullName.trim() ? '#10B981' : 'rgba(255,255,255,0.06)',
                color: fullName.trim() ? '#060a0e' : 'rgba(255,255,255,0.2)',
                boxShadow: fullName.trim() ? '0 0 24px rgba(16,185,129,0.35)' : 'none',
                cursor: fullName.trim() ? 'pointer' : 'not-allowed',
              }}>
              Sahada'ya Başla →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
