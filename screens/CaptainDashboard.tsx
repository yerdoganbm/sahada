import React, { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Reservation, CaptainPaymentPlan, MemberContribution, MatchRSVP, ScreenName } from '../types';

interface Props {
  currentUser: Player | null;
  teams: Team[];
  reservations: Reservation[];
  captainPaymentPlans: CaptainPaymentPlan[];
  memberContributions: MemberContribution[];
  matchRsvps: MatchRSVP[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onNavigateWithParam: (s: ScreenName, p: Record<string, any>) => void;
}

export const CaptainDashboard: React.FC<Props> = ({
  currentUser, teams, reservations, captainPaymentPlans, memberContributions, matchRsvps,
  onBack, onNavigate, onNavigateWithParam,
}) => {
  const myTeams = useMemo(() =>
    teams.filter(t => t.captainUserId === currentUser?.id),
    [teams, currentUser]
  );

  const myReservations = useMemo(() => {
    const myTeamIds = myTeams.map(t => t.id);
    return reservations
      .filter(r => r.teamId && myTeamIds.includes(r.teamId) && r.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [reservations, myTeams]);

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Kaptan Paneli ⚽</h1>
            <p className="text-xs text-slate-400">{myTeams.length} takım · {myReservations.length} rezervasyon</p>
          </div>
          <button onClick={() => onNavigate('captainOutbox')}
            className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
            <Icon name="inbox" size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate('teamManagement')}
            className="p-4 bg-surface rounded-2xl border border-white/5 hover:border-primary/20 transition-all text-left">
            <Icon name="groups" size={24} className="text-primary mb-2" />
            <p className="text-white font-bold text-sm">Takım Yönetimi</p>
            <p className="text-slate-500 text-xs">Davet, üyeler, IBAN</p>
          </button>
          <button onClick={() => onNavigate('captainBookingFlow')}
            className="p-4 bg-primary/8 rounded-2xl border border-primary/20 hover:border-primary/40 transition-all text-left">
            <Icon name="add_circle" size={24} className="text-primary mb-2" />
            <p className="text-primary font-bold text-sm">Maç Planla</p>
            <p className="text-primary/60 text-xs">Slot seç + ödeme topla</p>
          </button>
          <button onClick={() => onNavigate('captainOutbox')}
            className="p-4 bg-surface rounded-2xl border border-white/5 hover:border-white/10 transition-all text-left">
            <Icon name="campaign" size={24} className="text-slate-400 mb-2" />
            <p className="text-white font-bold text-sm">Mesajlar</p>
            <p className="text-slate-500 text-xs">Outbox ve hatırlatmalar</p>
          </button>
          <button onClick={() => onNavigate('memberMatchHub')}
            className="p-4 bg-surface rounded-2xl border border-white/5 hover:border-white/10 transition-all text-left">
            <Icon name="analytics" size={24} className="text-slate-400 mb-2" />
            <p className="text-white font-bold text-sm">Katılım & Durum</p>
            <p className="text-slate-500 text-xs">RSVP özeti</p>
          </button>
        </div>

        {/* Upcoming matches */}
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Yaklaşan Maçlar</h2>
          {myReservations.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-2xl border border-white/5">
              <Icon name="sports_soccer" size={36} className="text-slate-700 mb-2 mx-auto" />
              <p className="text-slate-500 text-sm mb-3">Henüz maç planlanmadı</p>
              <button onClick={() => onNavigate('captainBookingFlow')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-secondary font-bold text-sm">
                <Icon name="add" size={14} /> Maç Planla
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReservations.map(res => {
                const plan = captainPaymentPlans.find(p => p.reservationId === res.id);
                const contribs = memberContributions.filter(mc => mc.reservationId === res.id);
                const goingCount = matchRsvps.filter(r => r.reservationId === res.id && r.status === 'going').length;
                const unpaidCount = contribs.filter(mc => mc.status !== 'paid').length;
                const totalPaid = contribs.reduce((s, mc) => s + mc.paidAmount, 0);
                const totalExpected = contribs.reduce((s, mc) => s + mc.expectedAmount, 0);
                const collectPct = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
                const isPaid = res.venuePaymentStatus === 'paid';

                return (
                  <button key={res.id}
                    onClick={() => onNavigateWithParam('reservationPaymentHub', { reservationId: res.id })}
                    className="w-full bg-surface rounded-2xl p-4 border border-white/5 hover:border-white/10 text-left transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-bold">{res.venueName}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · {res.startTime}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                        res.status === 'confirmed' ? 'bg-green-500/15 border-green-500/20 text-green-400' :
                        'bg-yellow-500/15 border-yellow-500/20 text-yellow-400'
                      }`}>
                        {res.status === 'confirmed' ? '✓ Onaylı' : '⏳ Bekliyor'}
                      </span>
                    </div>

                    {/* Progress row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className={`text-sm font-black ${collectPct === 100 ? 'text-green-400' : collectPct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {collectPct}%
                        </p>
                        <p className="text-[9px] text-slate-600 uppercase">Toplama</p>
                      </div>
                      <div>
                        <p className={`text-sm font-black ${unpaidCount === 0 ? 'text-green-400' : 'text-orange-400'}`}>{unpaidCount}</p>
                        <p className="text-[9px] text-slate-600 uppercase">Eksik</p>
                      </div>
                      <div>
                        <p className={`text-sm font-black ${goingCount > 0 ? 'text-primary' : 'text-slate-500'}`}>{goingCount}</p>
                        <p className="text-[9px] text-slate-600 uppercase">Going</p>
                      </div>
                    </div>

                    {/* Fill bar */}
                    <div className="mt-2.5 h-1 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${collectPct === 100 ? 'bg-green-500' : collectPct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                        style={{ width: `${collectPct}%` }} />
                    </div>

                    {/* Sahaya ödeme badge */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isPaid ? 'border-green-500/20 text-green-400' : 'border-orange-500/20 text-orange-400'}`}>
                        {isPaid ? '✓ Sahaya ödendi' : '⏳ Sahaya ödeme bekleniyor'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
