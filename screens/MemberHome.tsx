import React, { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Player, Team, Reservation, MemberContribution, MatchRSVP, OutboxMessage, InboxItem, ScreenName } from '../types';

interface Props {
  currentUser: Player | null;
  teams: Team[];
  reservations: Reservation[];
  memberContributions: MemberContribution[];
  matchRsvps: MatchRSVP[];
  outboxMessages: OutboxMessage[];
  inboxItems?: InboxItem[];
  onBack: () => void;
  onNavigate: (s: ScreenName) => void;
  onNavigateWithParam: (s: ScreenName, p: Record<string, any>) => void;
  onJoinTeam: () => void;
}

export const MemberHome: React.FC<Props> = ({
  currentUser, teams, reservations, memberContributions, matchRsvps, outboxMessages,
  inboxItems = [],
  onBack, onNavigate, onNavigateWithParam, onJoinTeam,
}) => {
  const myTeams = useMemo(() =>
    teams.filter(t => t.memberUserIds.includes(currentUser?.id ?? '')),
    [teams, currentUser]
  );

  const myReservations = useMemo(() => {
    const myTeamIds = myTeams.map(t => t.id);
    return reservations
      .filter(r => r.teamId && myTeamIds.includes(r.teamId) && r.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [reservations, myTeams]);

  const myInbox = useMemo(() =>
    inboxItems
      .filter(i => i.userId === currentUser?.id)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 5),
    [inboxItems, currentUser]
  );
  const unreadInbox = myInbox.filter(i => i.status === 'unread').length;

  const myContribs = useMemo(() =>
    memberContributions.filter(mc => mc.memberUserId === currentUser?.id),
    [memberContributions, currentUser]
  );

  const totalUnpaid = myContribs.reduce((s, mc) => s + (mc.expectedAmount - mc.paidAmount), 0);

  if (!currentUser) return null;

  return (
    <div className="pb-24 bg-secondary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Merhaba, {currentUser.name?.split(' ')[0] ?? 'Üye'} 👋</h1>
            <p className="text-xs text-slate-400 mt-0.5">{myTeams.length} takım · {myReservations.length} yaklaşan maç</p>
          </div>
          <button onClick={() => onNavigate('memberPayments')} className="relative">
            <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
              <Icon name="payments" size={18} className="text-slate-400" />
            </div>
            {totalUnpaid > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">!</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Cold start: no teams yet → onboarding checklist */}
        {myTeams.length === 0 && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏁</span>
              <p className="text-white font-black text-sm">Başlamak için ne yapmalısın?</p>
            </div>
            <div className="space-y-2">
              {[
                { done: true,  icon: '✓', text: 'Hesabını oluşturdun', cls: 'text-green-400' },
                { done: false, icon: '2', text: 'Davet koduyla takıma katıl', cls: 'text-primary', action: onJoinTeam },
                { done: false, icon: '3', text: 'İlk maçına RSVP ver & ödeme yap', cls: 'text-slate-500', action: undefined },
              ].map((step, i) => (
                <button key={i} onClick={step.action} disabled={!step.action}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${step.action ? 'hover:bg-white/5 active:scale-[0.99]' : ''}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black ${step.done ? 'border-green-500 bg-green-500/20' : i === 1 ? 'border-primary bg-primary/10' : 'border-slate-700'}`}>
                    <span className={step.cls}>{step.icon}</span>
                  </div>
                  <p className={`text-sm font-bold ${step.done ? 'text-green-400 line-through decoration-green-700' : i === 1 ? 'text-white' : 'text-slate-600'}`}>{step.text}</p>
                  {step.action && <Icon name="chevron_right" size={14} className="text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Balance summary */}
        {totalUnpaid > 0 && (
          <button onClick={() => onNavigate('memberPayments')}
            className="w-full bg-red-500/8 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Icon name="warning" size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-bold text-sm">{totalUnpaid.toLocaleString('tr-TR')}₺ bekleyen ödeme</p>
              <p className="text-slate-500 text-xs">Kaptana ödemen gereken tutar</p>
            </div>
            <Icon name="chevron_right" size={16} className="text-slate-600 ml-auto" />
          </button>
        )}

        {/* Inbox / Reminders */}
        {myInbox.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bildirimler</h2>
              {unreadInbox > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                  {unreadInbox}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {myInbox.map(item => (
                <div key={item.id} className={`p-3.5 rounded-2xl border transition-all ${item.status === 'unread' ? 'bg-primary/5 border-primary/15' : 'bg-surface border-white/5'}`}>
                  <div className="flex items-start gap-2">
                    <Icon name="notifications" size={14} className={item.status === 'unread' ? 'text-primary mt-0.5' : 'text-slate-600 mt-0.5'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${item.status === 'unread' ? 'text-white' : 'text-slate-400'}`}>{item.title}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">{item.body.length > 80 ? item.body.slice(0, 80) + '…' : item.body}</p>
                      <p className="text-slate-700 text-[9px] mt-1">{new Date(item.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Yaklaşan Maçlar</h2>
            <button onClick={() => onNavigate('memberPayments')} className="text-xs text-primary font-bold">Ödemeler →</button>
          </div>
          {myReservations.length === 0 ? (
            <div className="text-center py-8 bg-surface rounded-2xl border border-white/5">
              <Icon name="sports_soccer" size={36} className="text-slate-700 mb-2 mx-auto" />
              <p className="text-slate-500 text-sm">Henüz maç yok</p>
              <p className="text-slate-600 text-xs mt-1">Takıma katılınca maçlar burada görünür</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReservations.map(res => {
                const contrib = myContribs.find(mc => mc.reservationId === res.id);
                const myRsvp = matchRsvps.find(r => r.reservationId === res.id && r.userId === currentUser.id);
                const team = myTeams.find(t => t.id === res.teamId);
                return (
                  <button key={res.id}
                    onClick={() => onNavigateWithParam('memberMatchDetails', { reservationId: res.id })}
                    className="w-full bg-surface rounded-2xl p-4 border border-white/5 hover:border-white/10 text-left transition-all active:scale-[0.99]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-bold text-sm">{res.venueName}</p>
                        <p className="text-slate-400 text-xs">
                          {new Date(res.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · {res.startTime}
                        </p>
                        {team && <p className="text-slate-600 text-[10px]">{team.name}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {myRsvp && myRsvp.status !== 'unset' && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg border ${
                            myRsvp.status === 'going' ? 'bg-green-500/15 border-green-500/20 text-green-400' :
                            myRsvp.status === 'not_going' ? 'bg-red-500/15 border-red-500/20 text-red-400' :
                            'bg-yellow-500/15 border-yellow-500/20 text-yellow-400'
                          }`}>
                            {myRsvp.status === 'going' ? '✓ GELİYORUM' : myRsvp.status === 'not_going' ? '✗ GELEMİYORUM' : '? BELİRSİZ'}
                          </span>
                        )}
                      </div>
                    </div>
                    {contrib && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                        <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <div className={`h-full rounded-full ${contrib.status === 'paid' ? 'bg-green-500' : contrib.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.round((contrib.paidAmount / contrib.expectedAmount) * 100)}%` }} />
                        </div>
                        <p className={`text-xs font-bold ${contrib.status === 'paid' ? 'text-green-400' : contrib.status === 'partial' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {contrib.status === 'paid' ? 'Ödendi ✓' : `${contrib.expectedAmount - contrib.paidAmount}₺ kaldı`}
                        </p>
                      </div>
                    )}
                    <p className="text-[9px] text-primary font-bold mt-2">Katılım & Ödeme →</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* My teams */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Takımlarım</h2>
          </div>
          {myTeams.length === 0 ? (
            <div className="text-center py-6 bg-surface rounded-2xl border border-white/5">
              <p className="text-slate-500 text-sm mb-3">Henüz bir takımda değilsin</p>
              <button onClick={onJoinTeam}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/25 text-primary font-bold text-sm">
                <Icon name="group_add" size={14} /> Davet Koduyla Katıl
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {myTeams.map(team => (
                <div key={team.id} className="bg-surface rounded-2xl p-3.5 border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon name="groups" size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{team.name}</p>
                    <p className="text-slate-500 text-xs">{team.memberUserIds.length} üye</p>
                  </div>
                </div>
              ))}
              <button onClick={onJoinTeam} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-sm font-bold flex items-center justify-center gap-2">
                <Icon name="group_add" size={14} /> Başka takıma katıl
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

