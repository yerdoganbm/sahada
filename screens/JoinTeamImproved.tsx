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
}

export const JoinTeamImproved: React.FC<Props> = ({
  currentUser, teamInvites, teams, memberProfiles, pendingJoinCode,
  onBack, onNavigate, onSetPendingCode, onSubmitJoin, onJoinSuccess,
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill from pending code or URL param
  useEffect(() => {
    if (pendingJoinCode) setCode(pendingJoinCode);
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [pendingJoinCode]);

  // Auto-submit if code pre-filled and user is ready
  useEffect(() => {
    if (pendingJoinCode && currentUser && code === pendingJoinCode) {
      handleJoin();
    }
  }, [currentUser, pendingJoinCode]); // eslint-disable-line

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setResult('Davet kodu girin.'); return; }
    setLoading(true);
    onSetPendingCode(trimmed);
    setTimeout(() => {
      const r = onSubmitJoin(trimmed);
      setLoading(false);
      if (r === 'joined') {
        setResult('joined');
        setTimeout(onJoinSuccess, 1500);
      } else {
        setResult(r);
      }
    }, 400);
  };

  const resultMeta: Record<string, { icon: string; color: string; title: string; body: string }> = {
    joined:               { icon: 'check_circle', color: 'text-green-400', title: 'Takıma Katıldın! 🎉', body: 'Maç ekranına yönlendiriliyorsun…' },
    pending:              { icon: 'hourglass_top', color: 'text-yellow-400', title: 'Onay Bekleniyor', body: 'Kaptan onayladığında bilgilendirileceksin.' },
    invalid:              { icon: 'error', color: 'text-red-400', title: 'Geçersiz Kod', body: 'Kodu doğru girdiğinden emin ol.' },
    expired:              { icon: 'schedule', color: 'text-red-400', title: 'Süresi Dolmuş', body: 'Bu davet kodu geçerliliğini yitirmiş.' },
    full:                 { icon: 'group_off', color: 'text-orange-400', title: 'Takım Dolu', body: 'Bu davet kodu maksimum kullanım sayısına ulaştı.' },
    redirect_auth:        { icon: 'lock', color: 'text-blue-400', title: 'Giriş Gerekiyor', body: 'Telefon ile giriş yapman gerekiyor…' },
    redirect_onboarding:  { icon: 'person_add', color: 'text-purple-400', title: 'Profil Tamamla', body: 'Ad soyad bilgisi için yönlendiriliyorsun…' },
  };

  const invite = code.trim() ? teamInvites.find(i => i.code === code.trim().toUpperCase() && i.status === 'active') : null;
  const team = invite ? teams.find(t => t.id === invite.teamId) : null;

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Takıma Katıl</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
        <div className="w-full space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <Icon name="group_add" size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-black text-2xl mb-1">Davet Kodunu Gir</h2>
            <p className="text-slate-400 text-sm">Kaptanın sana gönderdiği kodu yaz</p>
          </div>

          {/* Code input */}
          <div>
            <input
              value={code} onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setResult(null); }}
              placeholder="SAHADA24"
              maxLength={10}
              className="w-full bg-surface border-2 border-white/10 rounded-2xl px-4 py-4 text-white text-2xl font-black text-center tracking-widest focus:outline-none focus:border-primary transition-all uppercase"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {/* Team preview */}
          {team && !result && (
            <div className="bg-primary/8 border border-primary/20 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Icon name="groups" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{team.name}</p>
                <p className="text-slate-400 text-xs">{team.memberUserIds.length} üye</p>
              </div>
              <Icon name="check_circle" size={16} className="text-primary ml-auto" />
            </div>
          )}

          {/* Result */}
          {result && resultMeta[result] && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/8`}>
              <Icon name={resultMeta[result].icon} size={24} className={resultMeta[result].color + ' flex-shrink-0 mt-0.5'} />
              <div>
                <p className={`font-bold text-sm ${resultMeta[result].color}`}>{resultMeta[result].title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{resultMeta[result].body}</p>
              </div>
            </div>
          )}

          <button onClick={handleJoin} disabled={loading || !code.trim() || result === 'joined'}
            className="w-full py-4 rounded-2xl bg-primary text-secondary font-black text-base shadow-glow disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Kontrol ediliyor…</> : 'Katıl'}
          </button>

          {!currentUser && (
            <button onClick={() => onNavigate('phoneAuth')} className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm flex items-center justify-center gap-2">
              <Icon name="login" size={16} /> Giriş Yap
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
