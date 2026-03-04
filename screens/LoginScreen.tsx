import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon';

type UserType = 'player' | 'venue_owner' | null;

type Step = 'phone' | 'otp';

interface LoginScreenProps {
  onLogin: (userId: string, isNewTeam?: boolean) => void;
  onRegisterVenueOwner?: (phone: string) => void;
  onNavigate?: (screen: string, params?: any) => void;
  userType?: UserType;
}

// Mock OTP for demo
const MOCK_OTP = '123456';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegisterVenueOwner,
  onNavigate,
  userType: initialUserType = null,
}) => {
  const [userType] = useState<UserType>(initialUserType);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isVenueOwner = userType === 'venue_owner';

  // OTP countdown timer
  useEffect(() => {
    if (step !== 'otp') return;
    setOtpTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  };

  const rawPhone = phone.replace(/\s/g, '');
  const isPhoneValid = rawPhone.length === 10 && rawPhone.startsWith('5');

  const handlePhoneSubmit = () => {
    if (!isPhoneValid) {
      setError('Geçerli bir telefon numarası girin (5XX ile başlamalı)');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate SMS send
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1200);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (digit && index === 5) {
      const code = newOtp.join('');
      if (code.length === 6) {
        setTimeout(() => verifyOtp(newOtp), 100);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
      setTimeout(() => verifyOtp(newOtp), 100);
    }
  };

  const verifyOtp = (code: string[]) => {
    const entered = code.join('');
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);

      if (entered !== MOCK_OTP) {
        setError('Doğrulama kodu hatalı. Tekrar deneyin.');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      // OTP correct — resolve user
      resolveUser();
    }, 1000);
  };

  const resolveUser = () => {
    // Mock routing based on phone
    if (rawPhone === '5000000001' || rawPhone === '1') {
      onLogin('1'); // Admin
    } else if (rawPhone === '5000000007' || rawPhone === '7') {
      onLogin('7'); // Kaptan
    } else if (rawPhone === '5000000002' || rawPhone === '2') {
      onLogin('2'); // Üye

    } else if (rawPhone === '5000000099') {
      // Demo venue owner login
      onLogin('venue_owner_1');
    } else {
      // Unknown user
      if (isVenueOwner) {
        // New venue owner → onboarding
        if (onRegisterVenueOwner) {
          onRegisterVenueOwner(rawPhone);
        } else {
          onLogin('new_venue_owner_' + rawPhone);
        }
      } else {
        // New player → profile setup
        onLogin('new_player_' + rawPhone, false);
      }
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    setCanResend(false);
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpTimer(60);
      setCanResend(false);
      // restart timer via step trick
      setStep('phone');
      setTimeout(() => setStep('otp'), 10);
    }, 800);
  };

  const accent = isVenueOwner
    ? { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'focus:border-blue-500 focus:ring-blue-500/20', glow: 'bg-blue-500/10' }
    : { bg: 'bg-primary', hover: 'hover:bg-green-400', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]', text: 'text-primary', border: 'border-primary/30', ring: 'focus:border-primary focus:ring-primary/20', glow: 'bg-primary/10' };

  return (
    <div className="min-h-screen bg-secondary flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 ${isVenueOwner ? 'bg-blue-500/8' : 'bg-primary/8'} translate-x-1/2 -translate-y-1/2`} />
      </div>

      {/* Back Button */}
      {onNavigate && (
        <div className="relative z-10 px-5 pt-12">
          <button
            onClick={() => step === 'otp' ? setStep('phone') : onNavigate('welcome')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="arrow_back" size={20} className="text-white" />
          </button>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-10 max-w-sm mx-auto w-full">

        {/* Header */}
        <div className="mb-8">
          {/* Role badge */}
          {userType && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${accent.border} ${accent.glow} mb-4`}>
              <Icon name={isVenueOwner ? 'stadium' : 'sports_soccer'} size={13} className={accent.text} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>
                {isVenueOwner ? 'Saha Sahibi' : 'Oyuncu'}
              </span>
            </div>
          )}

          {step === 'phone' ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                {isVenueOwner ? 'Sahanı Sahada\'ya Ekle' : 'Hoş Geldin'}
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isVenueOwner
                  ? 'Telefon numaranı gir, seni tanıyalım. Yeni saha sahibi iseniz hemen kayıt başlatıyoruz.'
                  : 'Telefon numaranı gir. Varsa doğrudan giriş yaparız, yoksa profil oluşturursun.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SMS Doğrulama</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                <span className="text-white font-bold">+90 {phone}</span> numarasına gönderilen 6 haneli kodu gir.
              </p>
            </>
          )}
        </div>

        {/* ── STEP: PHONE ── */}
        {step === 'phone' && (
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Telefon Numarası</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center gap-2 pointer-events-none select-none">
                  <span className="text-base">🇹🇷</span>
                  <span className="text-slate-400 font-bold text-sm">+90</span>
                  <div className="w-px h-5 bg-white/10" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    setError('');
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && isPhoneValid) handlePhoneSubmit(); }}
                  placeholder="5XX XXX XX XX"
                  maxLength={13}
                  autoFocus
                  className={`w-full bg-surface border rounded-2xl pl-24 pr-4 py-4 text-white text-base font-bold placeholder-slate-700 focus:outline-none focus:ring-1 transition-all ${
                    error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : `border-white/10 ${accent.ring}`
                  }`}
                />
                {isPhoneValid && (
                  <div className={`absolute right-4 w-6 h-6 rounded-full ${accent.bg} flex items-center justify-center`}>
                    <Icon name="check" size={14} className="text-white" />
                  </div>
                )}
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <Icon name="error_outline" size={13} />
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={!isPhoneValid || isLoading}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${accent.bg} ${accent.hover} ${accent.shadow} text-${isVenueOwner ? 'white' : 'secondary'} disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
            >
              {isLoading ? (
                <Icon name="refresh" size={20} className="animate-spin" />
              ) : (
                <>SMS Kodu Gönder <Icon name="send" size={16} /></>
              )}
            </button>

            {/* Demo hints */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-2">Demo Giriş</p>
              <div className="space-y-1">
                <DemoHint phone="5000000001" label="Admin" accent={accent.text} onSelect={(p) => setPhone(formatPhone(p))} />
                <DemoHint phone="5000000099" label="Saha Sahibi (Kemal)" accent={accent.text} onSelect={(p) => setPhone(formatPhone(p))} />
                <DemoHint phone="5000000002" label="Üye" accent={accent.text} onSelect={(p) => setPhone(formatPhone(p))} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Doğrulama Kodu</label>
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    className={`flex-1 h-14 text-center text-xl font-black rounded-xl border bg-surface transition-all focus:outline-none focus:ring-1 ${
                      error
                        ? 'border-red-500/50 text-red-400'
                        : digit
                          ? `${accent.border} text-white ${accent.ring}`
                          : 'border-white/10 text-white focus:border-white/30'
                    }`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <Icon name="error_outline" size={13} />
                  {error}
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={() => verifyOtp(otp)}
              disabled={otp.join('').length < 6 || isLoading}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${accent.bg} ${accent.hover} ${accent.shadow} text-${isVenueOwner ? 'white' : 'secondary'} disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
            >
              {isLoading ? (
                <Icon name="refresh" size={20} className="animate-spin" />
              ) : (
                <>Doğrula & Giriş Yap <Icon name="verified" size={16} /></>
              )}
            </button>

            {/* Resend */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 text-xs">Kod gelmedi mi?</span>
              {canResend ? (
                <button
                  onClick={handleResend}
                  className={`font-bold text-xs ${accent.text} hover:opacity-80 transition-opacity`}
                >
                  Tekrar Gönder
                </button>
              ) : (
                <span className="text-slate-600 text-xs font-bold">{otpTimer}s bekle</span>
              )}
            </div>

            {/* Demo OTP hint */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-600">
                Demo kodu: <span className={`font-black ${accent.text} tracking-widest`}>1 2 3 4 5 6</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DemoHint: React.FC<{ phone: string; label: string; accent: string; onSelect: (p: string) => void }> = ({ phone, label, accent, onSelect }) => (
  <button
    onClick={() => onSelect(phone)}
    className="w-full flex items-center justify-between hover:bg-white/5 rounded-lg px-2 py-1 transition-colors group"
  >
    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
    <span className={`text-[10px] font-bold font-mono ${accent}`}>+90 {phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')}</span>
  </button>
);
