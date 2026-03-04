/**
 * JoinTeamScreen — WhatsApp invite deep-link landing
 * Flow A (Guest):  code → name → RSVP/payment view (read-only proof)
 * Flow B (Login):  code → phone → OTP → auto-join → dashboard
 */
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { GuestSession } from '../types';

interface JoinTeamScreenProps {
  onBack: () => void;
  initialCode?: string;
  teamName?: string;
  onGuestJoin: (session: GuestSession) => void;
  onLoginAndJoin: (phone: string, joinCode: string) => void;
}

type Step = 'code' | 'choose' | 'guest_name' | 'phone' | 'otp';

const MOCK_OTP = '123456';

export const JoinTeamScreen: React.FC<JoinTeamScreenProps> = ({
  onBack, initialCode = '', teamName = 'Sahada FC', onGuestJoin, onLoginAndJoin,
}) => {
  const [step, setStep] = useState<Step>(initialCode ? 'choose' : 'code');
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [codeError, setCodeError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'otp') return;
    setOtpTimer(60); setCanResend(false);
    const t = setInterval(() => {
      setOtpTimer(p => { if (p <= 1) { clearInterval(t); setCanResend(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const rawPhone = phone.replace(/\s/g, '');
  const isPhoneValid = rawPhone.length === 10 && rawPhone.startsWith('5');
  const otpString = otp.join('');

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
    return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;
  };

  const handleCheckCode = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length < 3) { setCodeError('Geçerli bir kod girin.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setCode(clean); setCodeError(''); setStep('choose'); }, 700);
  };

  const handleSendOtp = () => {
    if (!isPhoneValid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); }, 900);
  };

  const handleVerifyOtp = () => {
    if (otpString !== MOCK_OTP) { setOtpError(`Hatalı kod. Demo: ${MOCK_OTP}`); return; }
    setOtpError(''); setLoading(true);
    setTimeout(() => { setLoading(false); onLoginAndJoin(rawPhone, code); }, 700);
  };

  const handleOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g,'').slice(-1);
    const next = [...otp]; next[i] = d; setOtp(next); setOtpError('');
    if (d && i < 5) otpRefs.current[i+1]?.focus();
    if (next.every(x => x) && next.join('') === MOCK_OTP) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onLoginAndJoin(rawPhone, code); }, 500);
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  const handleGuestJoin = () => {
    if (!guestName.trim()) return;
    onGuestJoin({
      guestId: `guest_${Date.now()}`,
      displayName: guestName.trim(),
      joinCode: code,
      rsvpStatus: 'yes',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="flex items-center px-4 pt-5 pb-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface border border-white/8 flex items-center justify-center">
          <Icon name="arrow_back" className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
              <Icon name="sports_soccer" size={32} className="text-primary" />
            </div>
            {step === 'code' && <><h1 className="text-2xl font-black text-white mb-1">Takıma Katıl</h1><p className="text-slate-400 text-sm">Davet kodunu gir</p></>}
            {step === 'choose' && <><h1 className="text-2xl font-black text-white mb-1">{teamName}</h1><p className="text-slate-400 text-sm">Davet kodu onaylandı 🎉</p></>}
            {step === 'guest_name' && <><h1 className="text-2xl font-black text-white mb-1">Misafir Devam</h1><p className="text-slate-400 text-sm">Adını gir, maç bilgilerini gör</p></>}
            {step === 'phone' && <><h1 className="text-2xl font-black text-white mb-1">Telefon No</h1><p className="text-slate-400 text-sm">{teamName} takımına katılıyorsun</p></>}
            {step === 'otp' && <><h1 className="text-2xl font-black text-white mb-1">Doğrulama Kodu</h1><p className="text-slate-400 text-sm">0{rawPhone} numarasına gönderildi</p></>}
          </div>

          {/* CODE */}
          {step === 'code' && (
            <div className="space-y-4">
              <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleCheckCode()}
                placeholder="SAHADA-2024" autoFocus
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-4 text-white text-xl font-black text-center tracking-widest placeholder-slate-700 focus:outline-none focus:border-primary" />
              {codeError && <p className="text-xs text-red-400 text-center">{codeError}</p>}
              <button onClick={handleCheckCode} disabled={code.length < 3 || loading}
                className="w-full py-4 rounded-2xl bg-primary text-secondary font-black shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />Kontrol ediliyor…</> : 'Devam Et →'}
              </button>
            </div>
          )}

          {/* CHOOSE */}
          {step === 'choose' && (
            <div className="space-y-3">
              <div className="bg-surface rounded-2xl border border-white/8 p-4 flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon name="group" size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{teamName}</p>
                  <p className="text-[10px] text-slate-400">Kod: {code}</p>
                </div>
                <span className="text-[9px] font-black bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-1 rounded-lg">✓ Doğrulandı</span>
              </div>

              <button onClick={() => setStep('phone')}
                className="w-full p-4 rounded-2xl bg-primary text-secondary font-black flex items-center gap-3 shadow-glow">
                <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center flex-shrink-0">
                  <Icon name="phone" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm">Telefon ile Giriş / Kayıt</p>
                  <p className="text-[10px] opacity-70 font-normal">Ödeme kanıtı gönder, tam üyelik</p>
                </div>
                <Icon name="chevron_right" size={18} className="ml-auto opacity-70" />
              </button>

              <button onClick={() => setStep('guest_name')}
                className="w-full p-4 rounded-2xl bg-surface border border-white/10 text-white font-bold flex items-center gap-3 hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon name="person_outline" size={20} className="text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Misafir Olarak Devam</p>
                  <p className="text-[10px] text-slate-500">Sadece RSVP + ödeme bilgisi gör</p>
                </div>
                <Icon name="chevron_right" size={18} className="ml-auto text-slate-600" />
              </button>
            </div>
          )}

          {/* GUEST NAME */}
          {step === 'guest_name' && (
            <div className="space-y-4">
              <input value={guestName} onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuestJoin()}
                placeholder="Adın Soyadın" autoFocus
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-4 text-white text-lg font-bold text-center placeholder-slate-700 focus:outline-none focus:border-primary" />
              <button onClick={handleGuestJoin} disabled={!guestName.trim()}
                className="w-full py-4 rounded-2xl bg-white/10 border border-white/15 text-white font-black disabled:opacity-40">
                Maç Bilgilerini Gör →
              </button>
              <div className="flex items-start gap-2 p-3 bg-yellow-500/8 border border-yellow-500/15 rounded-xl">
                <Icon name="info" size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-300 leading-relaxed">Ödeme kanıtı yüklemek için hesap gereklidir. İstediğin zaman oluşturabilirsin.</p>
              </div>
              <button onClick={() => setStep('choose')} className="w-full text-slate-500 text-xs font-bold py-2">← Geri</button>
            </div>
          )}

          {/* PHONE */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+90</span>
                <input value={phone} onChange={e => setPhone(fmt(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && isPhoneValid && handleSendOtp()}
                  placeholder="532 000 00 00" type="tel" inputMode="numeric" autoFocus
                  className="w-full bg-surface border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white text-lg font-bold placeholder-slate-700 focus:outline-none focus:border-primary" />
              </div>
              <button onClick={handleSendOtp} disabled={!isPhoneValid || loading}
                className="w-full py-4 rounded-2xl bg-primary text-secondary font-black shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />Gönderiliyor…</> : 'Kod Gönder →'}
              </button>
              <p className="text-center text-[10px] text-slate-600">Demo: herhangi bir 05XX numarası çalışır</p>
              <button onClick={() => setStep('choose')} className="w-full text-slate-500 text-xs font-bold py-2">← Geri</button>
            </div>
          )}

          {/* OTP */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
                    value={d} onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    maxLength={1} inputMode="numeric"
                    className="w-12 h-14 bg-surface border border-white/10 rounded-xl text-white text-2xl font-black text-center focus:outline-none focus:border-primary transition-all" />
                ))}
              </div>
              {otpError && <p className="text-xs text-red-400 text-center">{otpError}</p>}
              <div className="flex items-center gap-2 p-3 bg-primary/8 border border-primary/15 rounded-xl">
                <Icon name="lock" size={13} className="text-primary flex-shrink-0" />
                <p className="text-[10px] text-primary/80">Demo kodu: <strong>{MOCK_OTP}</strong></p>
              </div>
              <button onClick={handleVerifyOtp} disabled={otpString.length < 6 || loading}
                className="w-full py-4 rounded-2xl bg-primary text-secondary font-black shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />Doğrulanıyor…</> : 'Doğrula & Katıl →'}
              </button>
              <div className="text-center">
                {canResend
                  ? <button onClick={() => { setOtp(['','','','','','']); setStep('phone'); }} className="text-primary text-xs font-bold">Kodu yeniden gönder</button>
                  : <span className="text-slate-600 text-xs">{otpTimer}sn sonra tekrar gönderebilirsin</span>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
