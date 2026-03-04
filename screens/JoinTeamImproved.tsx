import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, TeamInvite, MemberProfile, ScreenName } from '../types';

interface Props {
  currentUser: Player | null;
  teamInvites: TeamInvite[];
  teams: Team[];
  memberProfiles: MemberProfile[];
  pendingJoinCode?: string | null;
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onSetPendingCode: (code: string) => void;
  onSubmitJoin: (code: string) => 'joined' | 'pending' | 'invalid' | 'expired' | 'full' | 'redirect_auth' | 'redirect_onboarding';
  onJoinSuccess: () => void;
  /** Guest: sadece isim, RSVP görebilir */
  onGuestJoin?: (name: string, code: string) => void;
}

type JoinResult = 'joined' | 'pending' | 'invalid' | 'expired' | 'full' | 'redirect_auth' | 'redirect_onboarding' | null;

const RESULT_META: Record<string, { icon: string; color: string; title: string; body: string }> = {
  joined:   { icon: '🎉', color: 'text-green-400',  title: 'Takıma Katıldın!',       body: 'Seni bekliyoruz, iyi maçlar!' },
  pending:  { icon: '⏳', color: 'text-yellow-400', title: 'Onay Bekleniyor',         body: 'Kaptan onayladığında bildirim alacaksın.' },
  invalid:  { icon: '❌', color: 'text-red-400',    title: 'Geçersiz Kod',            body: 'Kodu kontrol et ve tekrar dene.' },
  expired:  { icon: '🕐', color: 'text-red-400',    title: 'Kodun Süresi Dolmuş',     body: 'Kaptandan yeni bir link iste.' },
  full:     { icon: '🚫', color: 'text-orange-400', title: 'Takım Dolu',              body: 'Maksimum üye sayısına ulaşıldı.' },
};

export const JoinTeamImproved: React.FC<Props> = ({
  currentUser, teamInvites, teams, memberProfiles, pendingJoinCode,
  onBack, onNavigate, onSetPendingCode, onSubmitJoin, onJoinSuccess, onGuestJoin,
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<JoinResult>(null);
  const [loading, setLoading] = useState(false);
  const [showGuest, setShowGuest] = useState(false);
  const [guestName, setGuestName] = useState('');

  // Auto-fill from pending code OR URL param
  useEffect(() => {
    const fromPending = pendingJoinCode ?? '';
    const urlCode = new URLSearchParams(window.location.search).get('code') ?? '';
    const resolved = (fromPending || urlCode).toUpperCase();
    if (resolved) {
      setCode(resolved);
      if (!pendingJoinCode && resolved) onSetPendingCode(resolved);
    }
  }, [pendingJoinCode]);

  // Auto-attempt join when user is freshly logged in + code is ready
  useEffect(() => {
    if (currentUser && code && !result) {
      handleJoin(code);
    }
  }, [currentUser]);

  const preview = teamInvites.find(i => i.code.toUpperCase() === code.toUpperCase() && i.status === 'active');
  const previewTeam = preview ? teams.find(t => t.id === preview.teamId) : null;

  const handleJoin = (codeToUse = code) => {
    const trimmed = codeToUse.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setTimeout(() => {
      const r = onSubmitJoin(trimmed);
      setLoading(false);
      setResult(r);
      if (r === 'joined') {
        setTimeout(onJoinSuccess, 1200);
      }
    }, 400);
  };

  const handleCodeChange = (v: string) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 12);
    setCode(clean);
    setResult(null);
    if (clean.length >= 6) onSetPendingCode(clean);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-white transition-colors mb-8">
          <Icon name="arrow_back" size={16} /> Geri
        </button>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏟️</span>
          <div>
            <h1 className="text-2xl font-black text-white">Takıma Katıl</h1>
            <p className="text-slate-500 text-xs">Kaptan WhatsApp'tan kodu gönderdi</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full space-y-4">
        {/* Code input */}
        {!showGuest && (
          <>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Davet Kodu</label>
              <input
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="SAHADA24"
                maxLength={12}
                autoCapitalize="characters"
                className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 text-white text-2xl font-black text-center tracking-[0.3em] focus:outline-none focus:border-primary transition-all"
                onKeyDown={e => e.key === 'Enter' && !loading && handleJoin()}
              />
            </div>

            {/* Team preview */}
            {previewTeam && !result && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">⚽</div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{previewTeam.name}</p>
                  <p className="text-slate-500 text-xs">{previewTeam.memberUserIds.length} üye</p>
                </div>
                <span className="text-[9px] font-black px-2 py-1 rounded-full bg-primary/20 text-primary">
                  {preview?.autoApprove ? 'Otomatik Onay' : 'Onay Gerekli'}
                </span>
              </div>
            )}

            {/* Result */}
            {result && RESULT_META[result] && (
              <div className={`p-4 rounded-2xl border ${result === 'joined' ? 'bg-green-500/8 border-green-500/20' : 'bg-white/4 border-white/10'}`}>
                <p className={`font-black text-base mb-1 ${RESULT_META[result].color}`}>
                  {RESULT_META[result].icon} {RESULT_META[result].title}
                </p>
                <p className="text-slate-500 text-xs">{RESULT_META[result].body}</p>
              </div>
            )}

            {/* CTA */}
            {!result && (
              <button
                onClick={() => handleJoin()}
                disabled={loading || code.trim().length < 4}
                className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <><span>Katıl</span><Icon name="arrow_forward" size={16} /></>
                }
              </button>
            )}

            {/* Auth gate notice */}
            {!currentUser && code.length >= 4 && (
              <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <p className="text-blue-300 text-xs text-center">
                  Katılmak için <button onClick={() => { onSetPendingCode(code); onNavigate('phoneAuth'); }} className="font-black underline">giriş yap</button> — kod kaydedildi ✓
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">veya</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            {/* Guest mode */}
            {onGuestJoin && (
              <button
                onClick={() => setShowGuest(true)}
                className="w-full py-3.5 rounded-2xl border border-white/8 text-slate-400 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="person_outline" size={16} />
                Misafir olarak devam et
              </button>
            )}

            <button
              onClick={() => { onSetPendingCode(code || ''); onNavigate('phoneAuth'); }}
              className="w-full py-3.5 rounded-2xl border border-white/8 text-slate-400 font-bold text-sm hover:bg-white/4 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="phone" size={15} />
              Hesabım var, giriş yap
            </button>
          </>
        )}

        {/* ── GUEST FLOW ── */}
        {showGuest && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
              <p className="text-yellow-300 text-xs font-bold">👤 Misafir mod — RSVP & ödeme bilgisini görebilirsin</p>
              <p className="text-slate-600 text-[10px] mt-1">Dekont göndermek için hesap gerekli</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Adın *</label>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full bg-surface border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-primary transition-all"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && guestName.trim() && onGuestJoin?.(guestName, code)}
              />
            </div>

            <button
              onClick={() => onGuestJoin?.(guestName.trim(), code)}
              disabled={!guestName.trim() || !code.trim()}
              className="w-full py-4 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-black text-base disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              Misafir Olarak Gir →
            </button>

            <button onClick={() => setShowGuest(false)} className="w-full text-slate-600 text-sm font-bold py-2 hover:text-slate-400 transition-colors">
              ← Geri
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
