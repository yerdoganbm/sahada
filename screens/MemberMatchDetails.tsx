import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Reservation, MemberContribution, CaptainPaymentPlan, CaptainPayoutProfile, MatchRSVP } from '../types';

interface Props {
  currentUser: Player | null;
  reservations: Reservation[];
  teams: Team[];
  memberContributions: MemberContribution[];
  captainPaymentPlans: CaptainPaymentPlan[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  matchRsvps: MatchRSVP[];
  navParams: Record<string, any>;
  onBack: () => void;
  onSetRSVP: (teamId: string, reservationId: string, userId: string, status: MatchRSVP['status'], note?: string) => void;
  onSubmitProof: (teamId: string, reservationId: string, userId: string, proofUrl: string, note?: string) => void;
}

const RSVP_OPTIONS: { status: MatchRSVP['status']; label: string; icon: string; cls: string }[] = [
  { status: 'going',     label: 'Geliyorum',    icon: 'check_circle',  cls: 'border-green-500/30 bg-green-500/10 text-green-400' },
  { status: 'maybe',     label: 'Belki',         icon: 'help',          cls: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
  { status: 'not_going', label: 'Gelemiyorum',   icon: 'cancel',        cls: 'border-red-500/30 bg-red-500/10 text-red-400' },
];

export const MemberMatchDetails: React.FC<Props> = ({
  currentUser, reservations, teams, memberContributions, captainPaymentPlans,
  captainPayoutProfiles, matchRsvps, navParams, onBack, onSetRSVP, onSubmitProof,
}) => {
  const reservationId = navParams.reservationId;
  const res = reservations.find(r => r.id === reservationId) ?? reservations.find(r => r.isCaptainFlow);
  const team = res?.teamId ? teams.find(t => t.id === res.teamId) : null;
  const contrib = memberContributions.find(mc => mc.reservationId === res?.id && mc.memberUserId === currentUser?.id);
  const plan = captainPaymentPlans.find(p => p.reservationId === res?.id);
  const captainProfile = team ? captainPayoutProfiles.find(p => p.captainUserId === team.captainUserId) : null;
  const myRsvp = matchRsvps.find(r => r.reservationId === res?.id && r.userId === currentUser?.id);

  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [proofSent, setProofSent] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const CopyBtn: React.FC<{ text: string; k: string; label?: string }> = ({ text, k, label }) => (
    <button onClick={() => copy(text, k)}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all ${copiedKey === k ? 'bg-green-500/15 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
      <Icon name={copiedKey === k ? 'check' : 'content_copy'} size={10} />
      {copiedKey === k ? 'Kopyalandı' : (label ?? 'Kopyala')}
    </button>
  );

  const eftRef = res ? `TEAM-${res.teamId}-RES-${res.id}-U${currentUser?.id?.slice(-3) ?? '000'}` : '';
  const allPaymentText = captainProfile?.iban
    ? `IBAN: ${captainProfile.iban}\nHesap: ${captainProfile.accountName}\nAçıklama: ${eftRef}\nTutar: ${contrib?.expectedAmount ?? '?'}₺`
    : '';

  if (!res) return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <p className="text-slate-400">Maç bulunamadı.</p>
    </div>
  );

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">{res.venueName}</h1>
            <p className="text-xs text-slate-400">
              {new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {res.startTime}–{res.endTime}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            res.status === 'confirmed' ? 'bg-green-500/15 border-green-500/20 text-green-400' :
            res.status === 'pending' ? 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400' :
            'bg-red-500/15 border-red-500/20 text-red-400'
          }`}>
            {res.status === 'confirmed' ? '✓ Onaylı' : res.status === 'pending' ? '⏳ Onay Bekleniyor' : 'İptal'}
          </span>
          {plan?.dueAt && plan.status === 'collecting' && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400">
              ⏰ Son: {new Date(plan.dueAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* RSVP */}
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Icon name="how_to_reg" size={16} className="text-primary" /> Katılım Durumun
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {RSVP_OPTIONS.map(opt => (
              <button key={opt.status}
                onClick={() => res.teamId && currentUser && onSetRSVP(res.teamId, res.id, currentUser.id, opt.status)}
                className={`py-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${myRsvp?.status === opt.status ? opt.cls : 'border-white/8 bg-white/3 text-slate-500 hover:border-white/20'}`}>
                <Icon name={opt.icon} size={18} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment panel */}
        {contrib && captainProfile && (
          <div className="bg-surface rounded-2xl p-4 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="payments" size={16} className="text-primary" /> Ödeme Bilgileri
            </h3>

            {/* Progress */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-slate-400">Ödendi</span>
                <span className={`text-xs font-black ${contrib.status === 'paid' ? 'text-green-400' : contrib.status === 'partial' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {contrib.paidAmount}₺ / {contrib.expectedAmount}₺
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${contrib.status === 'paid' ? 'bg-green-500' : contrib.status === 'partial' ? 'bg-yellow-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.round((contrib.paidAmount / contrib.expectedAmount) * 100)}%` }} />
              </div>
            </div>

            {contrib.status !== 'paid' && (
              <>
                {/* EFT info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between p-3 bg-secondary rounded-xl border border-white/8">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">IBAN</p>
                      <p className="text-white text-xs font-mono font-bold">{captainProfile.iban ?? '—'}</p>
                      <p className="text-slate-400 text-[10px]">{captainProfile.accountName} · {captainProfile.bankName}</p>
                    </div>
                    <CopyBtn text={captainProfile.iban ?? ''} k="iban" />
                  </div>

                  <div className="flex items-start justify-between p-3 bg-secondary rounded-xl border border-white/8">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">EFT Açıklaması</p>
                      <p className="text-white text-xs font-mono font-bold">{eftRef}</p>
                    </div>
                    <CopyBtn text={eftRef} k="eft" />
                  </div>

                  <div className="flex items-start justify-between p-3 bg-secondary rounded-xl border border-white/8">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Kalan Tutar</p>
                      <p className="text-white text-xl font-black">{contrib.expectedAmount - contrib.paidAmount}₺</p>
                    </div>
                    <CopyBtn text={`${contrib.expectedAmount - contrib.paidAmount}`} k="amount" />
                  </div>

                  {allPaymentText && (
                    <button onClick={() => copy(allPaymentText, 'all')}
                      className={`w-full py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${copiedKey === 'all' ? 'bg-green-500/15 border-green-500/20 text-green-400' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'}`}>
                      <Icon name={copiedKey === 'all' ? 'check' : 'content_copy'} size={14} />
                      {copiedKey === 'all' ? 'Kopyalandı!' : 'Hepsini Kopyala (IBAN+Açıklama+Tutar)'}
                    </button>
                  )}

                  {captainProfile.phoneForCash && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-white/8">
                      <Icon name="payments" size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-400">Nakit: {captainProfile.phoneForCash}</p>
                      <CopyBtn text={captainProfile.phoneForCash} k="cash" />
                    </div>
                  )}
                </div>

                {/* Kaptana mesaj kopyala */}
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kaptana Mesaj Taslağı</p>
                  <div className="space-y-1.5">
                    {[
                      { k: 'msg_paid', text: `Merhaba kaptan! EFT'yi yaptım. Açıklama: ${eftRef}. Tutar: ${contrib.expectedAmount - contrib.paidAmount}₺. İyi maçlar! ⚽` },
                      { k: 'msg_gone', text: 'Merhaba kaptan, bu hafta maça gelemeyeceğim. İyi maçlar!' },
                    ].map(({ k, text }) => (
                      <button key={k} onClick={() => copy(text, k)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${copiedKey === k ? 'border-green-500/20 bg-green-500/8 text-green-300' : 'border-white/8 bg-secondary text-slate-400 hover:border-white/15'}`}>
                        {copiedKey === k ? '✓ Kopyalandı' : text.length > 70 ? text.slice(0, 70) + '…' : text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proof */}
                {!proofSent ? (
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dekont Linki Gönder</p>
                    <input value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                      placeholder="https://drive.google.com/… veya imgur.com/…"
                      className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary mb-2" />
                    <input value={proofNote} onChange={e => setProofNote(e.target.value)}
                      placeholder="Not (opsiyonel)"
                      className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary mb-2" />
                    <button onClick={() => {
                        if (!proofUrl.trim() || !res.teamId || !currentUser) return;
                        onSubmitProof(res.teamId, res.id, currentUser.id, proofUrl, proofNote);
                        setProofSent(true);
                      }} disabled={!proofUrl.trim()}
                      className="w-full py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm disabled:opacity-40">
                      Kaptana Gönder
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                    <Icon name="check_circle" size={14} className="text-green-400" />
                    <p className="text-green-400 text-sm font-bold">Dekont kaptana iletildi ✓</p>
                  </div>
                )}
              </>
            )}

            {contrib.status === 'paid' && (
              <div className="flex items-center gap-2 p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                <Icon name="check_circle" size={18} className="text-green-400" />
                <p className="text-green-400 font-bold">Ödemen tamamlandı ✓</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
