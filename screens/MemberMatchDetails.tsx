import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { PaymentProofModal } from '../components/PaymentProofModal';
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

const RSVP_OPTIONS: { status: MatchRSVP['status']; label: string; icon: string }[] = [
  { status: 'going',     label: 'Geliyorum',  icon: 'check_circle' },
  { status: 'maybe',     label: 'Belki',      icon: 'help'         },
  { status: 'not_going', label: 'Gelemiyorum',icon: 'cancel'       },
];

const RSVP_COLORS: Record<string, { active: string; bg: string; border: string }> = {
  going:     { active: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
  maybe:     { active: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  not_going: { active: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'  },
};

export const MemberMatchDetails: React.FC<Props> = ({
  currentUser, reservations, teams, memberContributions, captainPaymentPlans,
  captainPayoutProfiles, matchRsvps, navParams, onBack, onSetRSVP, onSubmitProof,
}) => {
  const reservationId = navParams.reservationId;
  const res = reservations.find(r => r.id === reservationId) ?? reservations.find(r => (r as any).isCaptainFlow);
  const team = res?.teamId ? teams.find(t => t.id === res.teamId) : null;
  const contrib = memberContributions.find(mc => mc.reservationId === res?.id && mc.memberUserId === currentUser?.id);
  const plan = captainPaymentPlans.find(p => p.reservationId === res?.id);
  const captainProfile = team ? captainPayoutProfiles.find(p => p.captainUserId === team.captainUserId) : null;
  const myRsvp = matchRsvps.find(r => r.reservationId === res?.id && r.userId === currentUser?.id);

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const eftRef = res
    ? `SAHADA-${(res.teamId ?? 'TEAM').slice(-4).toUpperCase()}-${res.id.slice(-4).toUpperCase()}-U${(currentUser?.id ?? '000').slice(-3)}`
    : '';

  if (!res) return (
    <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
      <p className="text-slate-400">Maç bulunamadı.</p>
    </div>
  );

  const remaining = contrib ? contrib.expectedAmount - contrib.paidAmount : 0;
  const paidPct = contrib && contrib.expectedAmount > 0 ? Math.round((contrib.paidAmount / contrib.expectedAmount) * 100) : 0;

  return (
    <div className="pb-24 bg-[#0a0f14] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 pt-6 pb-4"
        style={{ background: 'linear-gradient(to bottom, #0a0f14 85%, transparent)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Icon name="arrow_back" className="text-white" size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white truncate">{res.venueName}</h1>
            <p className="text-xs text-slate-400">
              {new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })} · {res.startTime}–{res.endTime}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 pt-2">
        {/* Status + due */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{
              background: res.status === 'confirmed' ? 'rgba(16,185,129,0.15)'
                        : res.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              border: res.status === 'confirmed' ? '1px solid rgba(16,185,129,0.25)'
                    : res.status === 'pending' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(239,68,68,0.25)',
              color: res.status === 'confirmed' ? '#10B981' : res.status === 'pending' ? '#F59E0B' : '#EF4444',
            }}>
            {res.status === 'confirmed' ? '✓ Onaylı' : res.status === 'pending' ? '⏳ Onay Bekleniyor' : 'İptal'}
          </span>
          {plan?.dueAt && plan.status === 'collecting' && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
              ⏰ Son: {new Date(plan.dueAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* RSVP */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Icon name="how_to_reg" size={16} className="text-primary" /> Katılım Durumun
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {RSVP_OPTIONS.map(opt => {
              const isActive = myRsvp?.status === opt.status;
              const colors = RSVP_COLORS[opt.status];
              return (
                <button key={opt.status}
                  onClick={() => res.teamId && currentUser && onSetRSVP(res.teamId, res.id, currentUser.id, opt.status)}
                  className="py-3 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all active:scale-[0.97]"
                  style={{
                    background: isActive ? colors.bg : 'rgba(255,255,255,0.03)',
                    border: isActive ? `1px solid ${colors.border}` : '1px solid rgba(255,255,255,0.07)',
                    color: isActive ? colors.active : 'rgba(255,255,255,0.3)',
                  }}>
                  <Icon name={opt.icon} size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Panel */}
        {contrib && (
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Icon name="payments" size={16} className="text-primary" /> Ödeme
              </h3>
              {contrib.status === 'paid' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                  ✓ Tamamlandı
                </span>
              )}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-500">
                  Ödendi: <span className="font-black text-white">{contrib.paidAmount.toLocaleString('tr-TR')}₺</span>
                </span>
                <span className="text-xs text-slate-500">
                  Toplam: <span className="font-black text-white">{contrib.expectedAmount.toLocaleString('tr-TR')}₺</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${paidPct}%`,
                    background: contrib.status === 'paid' ? '#10B981' : contrib.status === 'partial' ? '#F59E0B' : '#EF4444',
                    boxShadow: contrib.status === 'paid' ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                  }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-600">{paidPct}% ödendi</span>
                {remaining > 0 && (
                  <span className="text-[10px] font-black"
                    style={{ color: contrib.status === 'partial' ? '#F59E0B' : '#EF4444' }}>
                    Kalan: {remaining.toLocaleString('tr-TR')}₺
                  </span>
                )}
              </div>
            </div>

            {/* Quick IBAN */}
            {contrib.status !== 'paid' && captainProfile?.iban && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Havale Bilgileri</p>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">IBAN</p>
                    <p className="text-white text-xs font-mono font-bold">{captainProfile.iban}</p>
                    <p className="text-slate-500 text-[10px]">{captainProfile.accountName} · {captainProfile.bankName}</p>
                  </div>
                  <button onClick={() => copy(captainProfile.iban ?? '', 'iban')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all"
                    style={{
                      background: copiedKey === 'iban' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: copiedKey === 'iban' ? '#10B981' : 'rgba(255,255,255,0.5)',
                    }}>
                    <Icon name={copiedKey === 'iban' ? 'check' : 'content_copy'} size={9} />
                    {copiedKey === 'iban' ? 'OK' : 'Kopyala'}
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            {contrib.status !== 'paid' && (
              <>
                {proofSubmitted ? (
                  <div className="flex items-center gap-2 px-3 py-3 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Icon name="check_circle" size={16} className="text-green-400" />
                    <div>
                      <p className="text-green-400 text-xs font-black">Bildirim kaptana iletildi ✓</p>
                      <p className="text-slate-500 text-[10px]">Kaptan onayladığında ödeme tamamlanır</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowProofModal(true)}
                    className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.06))',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10B981',
                    }}>
                    <Icon name="upload" size={15} />
                    Ödeme Bildir / Dekont Gönder
                  </button>
                )}
              </>
            )}

            {contrib.proofUrl && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon name="attachment" size={12} className="text-slate-400" />
                <a href={contrib.proofUrl} target="_blank" rel="noreferrer"
                  className="text-primary text-xs truncate flex-1 hover:underline">
                  {contrib.proofUrl.length > 50 ? contrib.proofUrl.slice(0, 50) + '…' : contrib.proofUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Match info */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Icon name="location_on" size={16} className="text-blue-400" /> Maç Detayı
          </h3>
          <div className="space-y-2">
            {[
              { icon: 'stadium',       label: 'Saha',  value: res.venueName },
              { icon: 'calendar_today',label: 'Tarih', value: new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) },
              { icon: 'schedule',      label: 'Saat',  value: `${res.startTime} – ${res.endTime}` },
              { icon: 'groups',        label: 'Takım', value: team?.name ?? res.teamName ?? '—' },
            ].map(item => (
              <div key={item.icon} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Icon name={item.icon} size={13} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase font-bold">{item.label}</p>
                  <p className="text-white text-xs font-bold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Proof Modal */}
      {showProofModal && contrib && (
        <PaymentProofModal
          contribution={contrib}
          captainProfile={captainProfile ?? null}
          eftRef={eftRef}
          onSubmit={({ method, amount, proofUrl, proofFile, note }) => {
            const url = proofUrl ?? (proofFile ? `[dosya:${proofFile.name}]` : `[${method}:${amount}₺]`);
            onSubmitProof(res.teamId ?? '', res.id, currentUser?.id ?? '', url, note);
            setProofSubmitted(true);
            setShowProofModal(false);
          }}
          onClose={() => setShowProofModal(false)}
        />
      )}
    </div>
  );
};
