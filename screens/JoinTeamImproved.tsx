/**
 * JoinTeamImproved — Ultra-premium join flow
 * NO phone auth needed. Code → team preview → name (if new) → done!
 */
import React, { useState, useEffect, useRef } from 'react';
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
  onGuestJoin?: (name: string, code: string) => void;
}

type Step = 'code' | 'name' | 'done';
type JoinStatus = 'joined' | 'pending' | 'invalid' | 'expired' | 'full' | null;

const STATUS_MAP: Record<string, { emoji: string; title: string; body: string; color: string; bg: string; border: string }> = {
  joined:  { emoji: '🎉', title: 'Takıma Katıldın!',   body: 'İyi maçlar, sahada görüşürüz!',            color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  pending: { emoji: '⏳', title: 'Onay Bekleniyor',     body: 'Kaptan onayladığında bildirim alacaksın.', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  invalid: { emoji: '✗',  title: 'Geçersiz Kod',        body: 'Kodu kontrol et veya kaptandan yeni iste.',color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  expired: { emoji: '🕐', title: 'Kodun Süresi Dolmuş', body: 'Kaptandan yeni bir davet linki iste.',     color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  full:    { emoji: '🚫', title: 'Takım Dolu',           body: 'Maksimum üye sayısına ulaşıldı.',          color: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)'  },
};

const CODE_LEN = 8;

export const JoinTeamImproved: React.FC<Props> = ({
  currentUser, teamInvites, teams, memberProfiles, pendingJoinCode,
  onBack, onNavigate, onSetPendingCode, onSubmitJoin, onJoinSuccess, onGuestJoin,
}) => {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [name, setName] = useState(currentUser?.name || '');
  const [status, setStatus] = useState<JoinStatus>(null);
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fromPending = pendingJoinCode ?? '';
    const urlCode = new URLSearchParams(window.location.search).get('code') ?? '';
    const resolved = (fromPending || urlCode).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
    if (resolved) {
      setCode(resolved);
      if (!pendingJoinCode && resolved) onSetPendingCode(resolved);
    }
  }, [pendingJoinCode]);

  useEffect(() => {
    if (currentUser && code.length >= 4 && step === 'code' && !status) {
      handleAttemptJoin();
    }
  }, [currentUser]);

  useEffect(() => {
    if (step === 'name') setTimeout(() => nameRef.current?.focus(), 150);
    if (step === 'code') setTimeout(() => codeRef.current?.focus(), 80);
  }, [step]);

  const preview = teamInvites.find(i =>
    i.code.toUpperCase() === code.toUpperCase() && i.status === 'active'
  );
  const previewTeam = preview ? teams.find(t => t.id === preview.teamId) : null;
  const codeValid = code.length >= 4 && !!preview;

  const handleCodeChange = (v: string) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
    setCode(clean);
    setStatus(null);
    if (clean.length >= 4) onSetPendingCode(clean);
  };

  const handleAttemptJoin = (displayName?: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;

    // No user and no name → show name step first
    if (!currentUser && !displayName && !onGuestJoin) {
      setStep('name');
      return;
    }
    if (!currentUser && !displayName) {
      setStep('name');
      return;
    }

    const joinAs = displayName || currentUser?.name || name || 'Yeni Üye';
    setLoading(true);

    setTimeout(() => {
      const r = onSubmitJoin(trimmed);
      setLoading(false);

      if (r === 'redirect_auth' || r === 'redirect_onboarding') {
        if (onGuestJoin && joinAs !== 'Yeni Üye') {
          onGuestJoin(joinAs, trimmed);
          return;
        }
        onSetPendingCode(trimmed);
        onNavigate('login');
        return;
      }

      setStatus(r);
      if (r === 'joined') {
        setConfetti(true);
        setStep('done');
        setTimeout(() => {
          setConfetti(false);
          onJoinSuccess();
        }, 1800);
      } else if (r === 'pending') {
        setStep('done');
        setTimeout(onJoinSuccess, 2500);
      } else {
        setStep('done');
      }
    }, 600);
  };

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    if (onGuestJoin) {
      setLoading(true);
      setTimeout(() => {
        onGuestJoin(name.trim(), code);
      }, 300);
    } else {
      handleAttemptJoin(name.trim());
    }
  };

  const confettiColors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#fff'];
  const steps: Step[] = ['code', 'name', 'done'];

  return (
    <>
      <style>{`
        @keyframes jt-in { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none} }
        @keyframes jt-confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(200px) rotate(540deg);opacity:0} }
        @keyframes jt-check { 0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes jt-bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
        .jt-1{animation:jt-in .5s cubic-bezier(.16,1,.3,1) both 0ms}
        .jt-2{animation:jt-in .5s cubic-bezier(.16,1,.3,1) both .06s}
        .jt-3{animation:jt-in .5s cubic-bezier(.16,1,.3,1) both .12s}
        .jt-4{animation:jt-in .5s cubic-bezier(.16,1,.3,1) both .20s}
        .jt-5{animation:jt-in .5s cubic-bezier(.16,1,.3,1) both .30s}
        .jt-bounce{animation:jt-bounce 1.2s ease infinite}
      `}</style>

      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#07090e 0%,#060a10 60%,#070a0e 100%)' }}>

        {/* ambient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-[0.12]" style={{ background: '#10B981' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" preserveAspectRatio="none">
            {Array.from({length:6}).map((_,i)=><line key={i} x1={`${i*20}%`} y1="0" x2={`${i*20}%`} y2="100%" stroke="white" strokeWidth="0.6"/>)}
            {Array.from({length:8}).map((_,i)=><line key={i} x1="0" y1={`${i*14}%`} x2="100%" y2={`${i*14}%`} stroke="white" strokeWidth="0.6"/>)}
          </svg>
        </div>

        {/* confetti */}
        {confetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({length:28}).map((_,i)=>(
              <div key={i} className="absolute w-2.5 h-2.5"
                style={{ left:`${Math.random()*100}%`, top:`${Math.random()*30}%`, background:confettiColors[i%confettiColors.length],
                  animation:`jt-confetti ${0.9+Math.random()*0.8}s ease ${Math.random()*0.4}s both`,
                  borderRadius:Math.random()>.5?'50%':'2px', transform:`rotate(${Math.random()*360}deg)` }} />
            ))}
          </div>
        )}

        {/* header */}
        <div className="relative z-10 flex-shrink-0 px-5 pt-14 pb-4">
          <div className="jt-1 flex items-center justify-between mb-7">
            <button onClick={onBack}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-[0.9]"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              {steps.map((s,i)=>(
                <div key={s} className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width:s===step?20:7, background:i<=steps.indexOf(step)?'#10B981':'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            <div className="w-10" />
          </div>

          {/* step headlines */}
          {step === 'code' && (
            <div className="jt-2 flex items-center gap-3">
              <div className="w-13 h-13 w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(16,185,129,0.12)', border:'1.5px solid rgba(16,185,129,0.25)' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <circle cx="13" cy="13" r="10" stroke="#10B981" strokeWidth="1.5"/>
                  <path d="M8 13c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5" stroke="#10B981" strokeWidth="1.2" strokeDasharray="2 2"/>
                  <line x1="3" y1="13" x2="23" y2="13" stroke="#10B981" strokeWidth="1.2" strokeDasharray="2 2"/>
                </svg>
              </div>
              <div>
                <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">Takıma Katıl</h1>
                <p className="text-slate-500 text-[13px]">Davet kodunu gir, hemen oyna</p>
              </div>
            </div>
          )}
          {step === 'name' && (
            <div className="jt-2">
              <div className="text-5xl mb-3">👋</div>
              <h1 className="text-[28px] font-black text-white leading-tight tracking-tight mb-1">Adını gir</h1>
              <p className="text-slate-500 text-[13px]">Takım üyeleri seni bu isimle tanıyacak</p>
            </div>
          )}
          {step === 'done' && status && STATUS_MAP[status] && (
            <div className="jt-2 text-center pt-2">
              <div className="text-6xl mb-3" style={{ animation:'jt-check .5s cubic-bezier(.34,1.56,.64,1) both' }}>{STATUS_MAP[status].emoji}</div>
              <h1 className="text-[28px] font-black text-white leading-tight mb-2">{STATUS_MAP[status].title}</h1>
              <p className="text-slate-400 text-[14px]">{STATUS_MAP[status].body}</p>
            </div>
          )}
        </div>

        {/* body */}
        <div className="relative z-10 flex-1 px-5 pb-10 flex flex-col min-h-0 overflow-y-auto">

          {/* ── CODE ── */}
          {step === 'code' && (
            <div className="flex flex-col flex-1">
              <div className="jt-3 mb-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Davet Kodu</label>
                <div className="relative">
                  <input
                    ref={codeRef}
                    value={code}
                    onChange={e => handleCodeChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && codeValid && handleAttemptJoin()}
                    placeholder="SAHADA24"
                    maxLength={CODE_LEN}
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="w-full text-center px-5 rounded-2xl font-black tracking-[0.3em] focus:outline-none transition-all duration-300"
                    style={{
                      height:72, fontSize:26,
                      fontFamily:"'JetBrains Mono',monospace",
                      background: codeValid ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                      border:`2px solid ${codeValid ? 'rgba(16,185,129,0.4)' : code.length>0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
                      color: codeValid ? '#10B981' : 'white',
                      boxShadow: codeValid ? '0 0 24px rgba(16,185,129,0.15)' : 'none',
                    }}
                  />
                  {codeValid && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background:'#10B981' }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#060a0e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-700 text-center mt-2">Demo: <span className="font-black text-slate-500 tracking-widest">SAHADA24</span></p>
              </div>

              {/* preview */}
              {previewTeam && (
                <div className="jt-4 mb-5 rounded-2xl overflow-hidden" style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)' }}>
                  <div className="px-4 py-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.2)' }}>⚽</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-[15px]">{previewTeam.name}</p>
                      <p className="text-slate-500 text-[11px]">{previewTeam.memberUserIds.length} oyuncu</p>
                    </div>
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: preview?.autoApprove ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: preview?.autoApprove ? '#10B981' : '#F59E0B', border:`1px solid ${preview?.autoApprove ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                      {preview?.autoApprove ? '⚡ Anında' : '⏳ Onaylı'}
                    </span>
                  </div>
                  <div className="mx-4 h-px" style={{ background:'rgba(16,185,129,0.1)' }} />
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#10B981' }} />
                    <p className="text-[11px] font-bold" style={{ color:'rgba(16,185,129,0.8)' }}>{preview?.usesCount ?? 0}/{preview?.maxUses ?? '∞'} kullanıldı</p>
                  </div>
                </div>
              )}

              {code.length >= 4 && !preview && (
                <div className="jt-4 mb-4 px-4 py-3 rounded-xl text-center" style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)' }}>
                  <p className="text-red-400 text-[12px] font-bold">Kod bulunamadı — kaptandan yeni iste</p>
                </div>
              )}

              <div className="flex-1" />

              <div className="jt-5 space-y-3">
                <button onClick={() => handleAttemptJoin()} disabled={loading || code.trim().length < 4}
                  className="w-full flex items-center justify-center gap-2.5 font-black text-[16px] rounded-2xl transition-all active:scale-[0.97]"
                  style={{ height:58, background:codeValid?'#10B981':'rgba(255,255,255,0.06)', color:codeValid?'#060a0e':'rgba(255,255,255,0.2)', boxShadow:codeValid?'0 0 32px rgba(16,185,129,0.4)':'none', cursor:codeValid?'pointer':'not-allowed' }}>
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>Kontrol ediliyor…</>
                    : <span>{currentUser ? 'Katıl →' : 'Devam Et →'}</span>}
                </button>
                {!currentUser && (
                  <button onClick={() => { onSetPendingCode(code || ''); onNavigate('login'); }}
                    className="w-full flex items-center justify-center gap-2 font-bold text-[13px] rounded-2xl transition-all active:scale-[0.97]"
                    style={{ height:46, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.35)' }}>
                    Hesabım var, giriş yap
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── NAME ── */}
          {step === 'name' && (
            <div className="flex flex-col flex-1">
              {previewTeam && (
                <div className="jt-3 flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl" style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)' }}>
                  <span className="text-xl">⚽</span>
                  <div>
                    <p className="text-white text-[13px] font-black">{previewTeam.name}</p>
                    <p className="text-slate-600 text-[10px]">Kod: {code}</p>
                  </div>
                </div>
              )}
              <div className="jt-3 mb-4">
                <input ref={nameRef} value={name} onChange={e=>setName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&name.trim().length>=2&&handleNameSubmit()}
                  placeholder="Ad Soyad" className="w-full px-5 rounded-2xl text-white text-[20px] font-black focus:outline-none transition-all"
                  style={{ height:64, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${name.trim().length>=2?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`, boxShadow:name.trim().length>=2?'0 0 20px rgba(16,185,129,0.15)':'none', caretColor:'#10B981' }} />
                <p className="text-slate-700 text-[10px] mt-2 text-center">En az 2 karakter</p>
              </div>
              <div className="jt-4 flex gap-2 mb-6">
                {['⚽','🔥','💪','⚡','🎯','🏃'].map(e=>(
                  <button key={e} onClick={()=>setName(n=>n+e)} className="flex-1 h-10 rounded-xl text-base flex items-center justify-center transition-all active:scale-[0.88]"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>{e}</button>
                ))}
              </div>
              <div className="flex-1"/>
              <div className="jt-5 space-y-3">
                <button onClick={handleNameSubmit} disabled={name.trim().length<2||loading}
                  className="w-full flex items-center justify-center gap-2.5 font-black text-[16px] rounded-2xl transition-all active:scale-[0.97]"
                  style={{ height:58, background:name.trim().length>=2?'#10B981':'rgba(255,255,255,0.06)', color:name.trim().length>=2?'#060a0e':'rgba(255,255,255,0.2)', boxShadow:name.trim().length>=2?'0 0 32px rgba(16,185,129,0.4)':'none', cursor:name.trim().length>=2?'pointer':'not-allowed' }}>
                  {loading ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>Katılıyor…</> : <span>Takıma Katıl →</span>}
                </button>
                <button onClick={()=>setStep('code')} className="w-full text-center text-[12px] font-bold text-slate-700 py-2 hover:text-slate-500 transition-colors">← Kodu değiştir</button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && status && STATUS_MAP[status] && (
            <div className="flex flex-col flex-1 items-center justify-center text-center pb-8">
              <div className="jt-3 px-6 py-5 rounded-3xl mb-6 max-w-[280px]"
                style={{ background:STATUS_MAP[status].bg, border:`1px solid ${STATUS_MAP[status].border}` }}>
                <p className="text-[13px] font-bold" style={{ color:STATUS_MAP[status].color }}>
                  {status==='joined' ? `${previewTeam?.name??'Takım'} seni bekliyor!` : STATUS_MAP[status].body}
                </p>
              </div>
              {status==='joined' && <div className="jt-bounce mt-2"><span className="text-5xl">⚽</span></div>}
              {(status==='invalid'||status==='expired'||status==='full') && (
                <button onClick={()=>{setStep('code');setStatus(null);}} className="px-6 py-3 rounded-2xl font-black text-[14px] transition-all active:scale-[0.97]"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'white' }}>Tekrar Dene</button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
