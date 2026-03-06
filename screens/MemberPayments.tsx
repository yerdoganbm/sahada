import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Reservation, MemberContribution, CaptainPayoutProfile, ScreenName, ProofEntry } from '../types';

interface Props {
  currentUser: Player | null;
  reservations: Reservation[];
  memberContributions: MemberContribution[];
  captainPayoutProfiles: CaptainPayoutProfile[];
  teams: Team[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onNavigateWithParam: (s: ScreenName, p: Record<string, any>) => void;
  onSubmitProof: (teamId: string, reservationId: string, userId: string, proofUrl: string, note?: string) => void;
  onOpenPaymentModal?: (opts: { teamId: string; reservationId: string; userId: string; memberName?: string; expectedAmount: number; paidAmount?: number; captainMode?: boolean }) => void;
}

type Filter = 'all' | 'unpaid' | 'partial' | 'paid';

export const MemberPayments: React.FC<Props> = ({
  currentUser, reservations, memberContributions, captainPayoutProfiles, teams,
  onBack, onNavigate, onNavigateWithParam, onSubmitProof, onOpenPaymentModal,
}) => {
  const [filter, setFilter] = useState<Filter>('all');

  const myContribs = useMemo(() => {
    return memberContributions
      .filter(mc => mc.memberUserId === currentUser?.id)
      .filter(mc => filter === 'all' || mc.status === filter)
      .map(mc => {
        const res = reservations.find(r => r.id === mc.reservationId);
        const team = teams.find(t => t.id === mc.teamId);
        const captainProfile = team ? captainPayoutProfiles.find(p => p.captainUserId === team.captainUserId) : null;
        return { mc, res, team, captainProfile };
      })
      .sort((a, b) => (a.res?.date ?? '').localeCompare(b.res?.date ?? ''));
  }, [memberContributions, filter, reservations, teams, captainPayoutProfiles, currentUser]);

  const totals = useMemo(() => {
    const all = memberContributions.filter(mc => mc.memberUserId === currentUser?.id);
    return {
      expected: all.reduce((s, mc) => s + mc.expectedAmount, 0),
      paid: all.reduce((s, mc) => s + mc.paidAmount, 0),
      remaining: all.reduce((s, mc) => s + (mc.expectedAmount - mc.paidAmount), 0),
    };
  }, [memberContributions, currentUser]);

  const [copiedKey, setCopiedKey] = useState('');
  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const FILTERS: { v: Filter; label: string }[] = [
    { v: 'all', label: 'Tümü' },
    { v: 'unpaid', label: 'Ödenmedi' },
    { v: 'partial', label: 'Kısmi' },
    { v: 'paid', label: 'Ödendi' },
  ];

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Ödemelerim</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Toplam', value: totals.expected, color: 'text-white' },
            { label: 'Ödendi', value: totals.paid, color: 'text-green-400' },
            { label: 'Kalan', value: totals.remaining, color: totals.remaining > 0 ? 'text-red-400' : 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface rounded-2xl p-3 border border-white/5 text-center">
              <p className={`text-lg font-black ${color}`}>{value.toLocaleString('tr-TR')}₺</p>
              <p className="text-[10px] text-slate-500 uppercase">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${filter === f.v ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-surface border-white/8 text-slate-400'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Contribution list */}
        {myContribs.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-white/5">
            <Icon name="payments" size={40} className="text-slate-700 mb-2 mx-auto" />
            <p className="text-slate-500">Ödeme kaydı bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myContribs.map(({ mc, res, captainProfile }) => {
              const eftRef = res ? `TEAM-${mc.teamId}-RES-${res.id}-U${currentUser?.id?.slice(-3) ?? '000'}` : '';
              const remaining = mc.expectedAmount - mc.paidAmount;
              return (
                <div key={mc.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                  {/* Header */}
                  <button onClick={() => res && onNavigateWithParam('memberMatchDetails', { reservationId: res.id })}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-white/3 transition-all">
                    <div>
                      <p className="text-white font-bold text-sm">{res?.venueName ?? 'Bilinmeyen Saha'}</p>
                      <p className="text-slate-400 text-xs">
                        {res ? new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' · ' + res.startTime : '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                      mc.status === 'paid' ? 'bg-green-500/15 border-green-500/20 text-green-400' :
                      mc.status === 'partial' ? 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/15 border-red-500/20 text-red-400'
                    }`}>
                      {mc.status === 'paid' ? '✓ Ödendi' : mc.status === 'partial' ? `${remaining}₺ kaldı` : `${mc.expectedAmount}₺ bekliyor`}
                    </span>
                  </button>

                  {/* Quick pay / proof button */}
                  {mc.status !== 'paid' && onOpenPaymentModal && res && (
                    <div className="px-4 pb-3 pt-0">
                      <button
                        onClick={() => onOpenPaymentModal({ teamId: mc.teamId, reservationId: mc.reservationId, userId: mc.memberUserId, memberName: currentUser?.name ?? '', expectedAmount: mc.expectedAmount, paidAmount: mc.paidAmount })}
                        className="w-full py-2.5 rounded-xl font-black text-[12px] flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
                        💳 Ödeme / Dekont Gönder
                      </button>
                    </div>
                  )}

                  {/* Proof history */}
                  {mc.proofHistory && mc.proofHistory.length > 0 && (
                    <div className="px-4 pb-3 border-t border-white/5 pt-3">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-wider">Dekont Geçmişi ({mc.proofHistory.length})</p>
                      <div className="space-y-2">
                        {mc.proofHistory.map((proof: ProofEntry) => (
                          <div key={proof.id} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2 border border-white/5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{proof.type === 'image' ? '🖼' : proof.type === 'pdf' ? '📄' : '🔗'}</span>
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">
                                  {proof.method === 'eft' ? 'EFT/Havale' : proof.method === 'cash' ? 'Nakit' : 'Kart'} · ₺{proof.amount}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  {new Date(proof.submittedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  {proof.note && ` · ${proof.note}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {proof.url && (
                                <a href={proof.url} target="_blank" rel="noopener noreferrer"
                                  className="text-[9px] font-bold px-2 py-1 rounded-lg border border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition-all">
                                  Görüntüle
                                </a>
                              )}
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                proof.status === 'approved' ? 'bg-green-500/15 text-green-400' :
                                proof.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                                'bg-yellow-500/15 text-yellow-400'
                              }`}>
                                {proof.status === 'approved' ? '✓ Onaylı' : proof.status === 'rejected' ? '✗ Reddedildi' : '⏳ Bekliyor'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment info for unpaid */}
                  {mc.status !== 'paid' && captainProfile?.iban && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase mb-0.5">IBAN</p>
                          <p className="text-white text-xs font-mono">{captainProfile.iban}</p>
                        </div>
                        <button onClick={() => copy(captainProfile.iban ?? '', 'iban_' + mc.id)}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg border transition-all ${copiedKey === 'iban_' + mc.id ? 'border-green-500/20 text-green-400' : 'border-white/10 text-slate-400'}`}>
                          {copiedKey === 'iban_' + mc.id ? '✓' : 'Kopyala'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-slate-500 font-mono">{eftRef}</p>
                        <button onClick={() => copy(eftRef, 'eft_' + mc.id)}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg border transition-all ${copiedKey === 'eft_' + mc.id ? 'border-green-500/20 text-green-400' : 'border-white/10 text-slate-400'}`}>
                          {copiedKey === 'eft_' + mc.id ? '✓' : 'Açıklamayı Kopyala'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
