import React, { useState } from 'react';
import { ProfileMenu } from '../components/ProfileMenu';
import { Icon } from '../components/Icon';
import { ScreenName, Player, RsvpStatus, TransferRequest, Match, TeamProfile } from '../types';

interface DashboardProps {
  onNavigate: (screen: ScreenName, params?: any) => void;
  currentUser: Player;
  rsvpStatus: RsvpStatus;
  onRsvpChange: (status: RsvpStatus) => void;
  transferRequests?: TransferRequest[];
  allMatches?: Match[];
  allPlayers?: Player[];
  teamProfile?: TeamProfile | null;
  onLogout?: () => void;
}

// ─── Tier config ──────────────────────────────────────────────────
const TIER = {
  partner:  { label: 'Saha Partner',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  premium:  { label: 'Pro Baller',    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' },
  free:     { label: 'Starter',       color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20' },
};

// ─── Quick Action definitions by role ─────────────────────────────
const ADMIN_ACTIONS = [
  { icon: 'admin_panel_settings', label: 'Yönetim',      screen: 'admin',            accent: '#6366f1' },
  { icon: 'group_add',            label: 'Üyeler',       screen: 'members',          accent: '#3b82f6' },
  { icon: 'groups',               label: 'Kadro',        screen: 'team',             accent: '#10b981' },
  { icon: 'event_note',           label: 'Rezervasyonlar', screen: 'myReservations', accent: '#10b981' },
  { icon: 'bar_chart',            label: 'Finans',       screen: 'financialReports', accent: '#a855f7' },
  { icon: 'how_to_vote',          label: 'Anketler',     screen: 'polls',            accent: '#f97316' },
] as const;

const CAPTAIN_ACTIONS = [
  { icon: 'sports_soccer',   label: 'Kaptan Paneli',  screen: 'captainDashboard',    accent: '#10b981' },
  { icon: 'shield',          label: 'Takım Yönet',   screen: 'teamManagement',      accent: '#6366f1' },
  { icon: 'calendar_add_on', label: 'Maç Planla',    screen: 'captainBookingFlow',  accent: '#3b82f6' },
  { icon: 'outbox',          label: 'Mesajlar',      screen: 'captainOutbox',       accent: '#a855f7' },
  { icon: 'group_add',       label: 'Üyeler',        screen: 'members',             accent: '#3b82f6' },
  { icon: 'emoji_events',    label: 'Turnuva',       screen: 'tournament',          accent: '#f59e0b' },
] as const;

const MEMBER_ACTIONS = [
  { icon: 'home',           label: 'Üye Paneli',     screen: 'memberHome',     accent: '#10b981' },
  { icon: 'payments',       label: 'Ödemelerim',     screen: 'memberPayments', accent: '#10b981' },
  { icon: 'link',           label: 'Takıma Katıl',   screen: 'joinTeam',       accent: '#6366f1' },
  { icon: 'emoji_events',   label: 'Turnuva',        screen: 'tournament',     accent: '#f59e0b' },
  { icon: 'event_note',     label: 'Rezervasyonlar', screen: 'myReservations', accent: '#10b981' },
  { icon: 'leaderboard',    label: 'Sıralama',       screen: 'leaderboard',    accent: '#a855f7' },
] as const;

// ─── Quick Action Button ──────────────────────────────────────────
const QA = ({ icon, label, accent, onClick }: {
  icon: string; label: string; accent: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group btn-press transition-all flex-1 min-w-0"
    style={{ minWidth: 64, maxWidth: 88 }}
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-active:scale-95"
      style={{
        background: accent + '18',
        border: `1.5px solid ${accent}30`,
        boxShadow: `0 4px 16px ${accent}14`,
      }}
    >
      <Icon name={icon} size={24} className="" style={{ color: accent }} />
    </div>
    <span
      className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap overflow-hidden"
      style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 72, textOverflow: 'ellipsis' }}
    >
      {label}
    </span>
  </button>
);

// ─── Notification dot ─────────────────────────────────────────────
const NotifDot = () => (
  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#0b0f1a] animate-pulse" />
);

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  currentUser,
  rsvpStatus,
  onRsvpChange,
  transferRequests = [],
  allMatches = [],
  allPlayers = [],
  teamProfile,
  onLogout,
}) => {
  const [hasNotification] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const hasMatches = allMatches.length > 0;
  const nextMatch  = allMatches.find(m => m.status === 'upcoming') || allMatches[0];

  const joinedCount = 11 + (rsvpStatus === 'yes' ? 1 : 0);
  const totalSlots  = 14;
  const percentage  = Math.min((joinedCount / totalSlots) * 100, 100);

  const isAdmin   = currentUser.role === 'admin';
  const isCaptain = currentUser.isCaptain;
  const tier      = TIER[(currentUser.tier as keyof typeof TIER) ?? 'free'] ?? TIER.free;

  const actions = isAdmin ? ADMIN_ACTIONS : isCaptain ? CAPTAIN_ACTIONS : MEMBER_ACTIONS;
  const pendingApprovals = transferRequests.filter(tr => tr.status === 'pending_captain');

  // Split actions into rows of 4
  const row1 = actions.slice(0, 4);
  const row2 = actions.slice(4);

  return (
    <div className="min-h-screen text-white sc-in" style={{ background: '#07090e' }}>

      {/* ── Header ── */}
      <div
        className="sticky top-0 z-40 px-4 pt-12 pb-3"
        style={{ background: 'linear-gradient(to bottom, #07090e 85%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center justify-between">

          {/* Left: Avatar + name */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 btn-press"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-2xl object-cover border"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-500 animate-pulse"
                style={{ borderColor: '#07090e' }}
              />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Hoş geldin 👋</p>
              <h1 className="text-[15px] font-black text-white leading-tight">{currentUser.name}</h1>
            </div>
          </button>

          {/* Right: badge + notif + settings */}
          <div className="flex items-center gap-2">
            {/* Tier badge */}
            <div
              className={`text-[9px] font-black px-2 py-1 rounded-full border ${tier.color} ${tier.bg} ${tier.border}`}
              style={{ letterSpacing: '0.06em' }}
            >
              {currentUser.isCaptain ? '⚽ ' : ''}{tier.label.toUpperCase()}
            </div>

            {/* Notifications */}
            <button
              onClick={() => onNavigate('notifications')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center btn-press"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Icon name={hasNotification ? 'notifications' : 'notifications_off'} size={20} filled={hasNotification} className="text-white" />
              {hasNotification && <NotifDot />}
            </button>

            {/* Settings / Profile menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center btn-press"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Icon name="more_vert" size={20} className="text-slate-400" />
              </button>
              {showProfileMenu && (
                <ProfileMenu
                  user={currentUser}
                  onNavigate={onNavigate}
                  onLogout={onLogout}
                  onClose={() => setShowProfileMenu(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Team name strip */}
        {teamProfile && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: teamProfile.colors?.[0] ?? '#10b981' }}
            />
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {teamProfile.name}
            </span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              · {allPlayers.length} oyuncu
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-28 space-y-4">

        {/* ── Pending captain approval banner ── */}
        {isCaptain && pendingApprovals.length > 0 && (
          <button
            onClick={() => onNavigate('polls')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl btn-press rv rv-1"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)' }}
            >
              <Icon name="gavel" size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-bold text-white">Transfer Onayı Bekliyor</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{pendingApprovals.length} oyuncu onay bekliyor</p>
            </div>
            <span
              className="text-[10px] font-black px-2 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
            >
              {pendingApprovals.length}
            </span>
          </button>
        )}

        {/* ── Next match card ── */}
        {hasMatches ? (
          <button
            onClick={() => onNavigate('matchDetails', { matchId: nextMatch.id })}
            className="w-full rounded-3xl overflow-hidden relative btn-press rv rv-2"
            style={{
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #0d1f17 0%, #071810 100%)',
              border: '1px solid rgba(16,185,129,0.15)',
              boxShadow: '0 20px 60px rgba(16,185,129,0.08)',
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
            />
            {/* Field lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(90deg, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%), linear-gradient(0deg, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)', backgroundSize: '40px 40px' }}
            />

            {/* BUGÜN pill */}
            <div className="absolute top-3 left-3">
              <span
                className="text-[10px] font-black px-3 py-1 rounded-full"
                style={{ background: '#10b981', color: '#fff', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}
              >
                BUGÜN
              </span>
            </div>

            {/* Share */}
            <button
              onClick={e => { e.stopPropagation(); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Icon name="ios_share" size={16} className="text-white" />
            </button>

            {/* Match info */}
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
              <h2 className="text-2xl font-black text-white mb-1.5" style={{ letterSpacing: '-0.02em' }}>
                Bu Akşam {nextMatch.time}
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon name="location_on" size={14} style={{ color: '#10b981' }} />
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{nextMatch.location}</span>
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <Icon name="cloud" size={12} className="text-blue-400" /> 18°C
                </div>
              </div>
            </div>
          </button>
        ) : (
          /* Empty state */
          <button
            onClick={() => isAdmin ? onNavigate('matchCreate') : undefined}
            className="w-full rounded-3xl flex flex-col items-center justify-center gap-4 p-8 rv rv-2"
            style={{
              aspectRatio: '16/9',
              background: 'rgba(255,255,255,0.025)',
              border: '1.5px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: isAdmin ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1.5px dashed ${isAdmin ? '#10b981' : 'rgba(255,255,255,0.1)'}` }}
            >
              <Icon name={isAdmin ? 'add' : 'event_busy'} size={32} style={{ color: isAdmin ? '#10b981' : 'rgba(255,255,255,0.2)' }} />
            </div>
            <div className="text-center">
              <p className="text-base font-black text-white mb-1">{isAdmin ? 'İlk Maçını Planla' : 'Henüz Maç Yok'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isAdmin ? 'Takımın hazır, sahayı ayarla!' : 'Kaptanın maç oluşturması bekleniyor.'}
              </p>
            </div>
          </button>
        )}

        {/* ── Quick Actions ── */}
        <div className="rv rv-3">
          <p className="text-[10px] font-black tracking-widest uppercase mb-3 px-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Hızlı İşlemler
          </p>

          {/* Row 1 */}
          <div className="flex gap-2 mb-3">
            {row1.map(a => (
              <QA
                key={a.screen}
                icon={a.icon}
                label={a.label}
                accent={a.accent}
                onClick={() => onNavigate(a.screen as ScreenName)}
              />
            ))}
          </div>

          {/* Row 2 */}
          {row2.length > 0 && (
            <div className="flex gap-2">
              {row2.map(a => (
                <QA
                  key={a.screen}
                  icon={a.icon}
                  label={a.label}
                  accent={a.accent}
                  onClick={() => onNavigate(a.screen as ScreenName)}
                />
              ))}
              {/* Spacer for alignment */}
              {Array.from({ length: 4 - row2.length }).map((_, i) => (
                <div key={i} className="flex-1" style={{ minWidth: 64, maxWidth: 88 }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Match Prep Progress ── */}
        {hasMatches && (
          <div
            className="rounded-3xl p-4 rv rv-4"
            style={{ background: '#0f1520', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="fitness_center" size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm font-bold text-white">Maç Hazırlığı</span>
              </div>
              <span
                className="text-xs font-black"
                style={{ color: joinedCount >= totalSlots ? '#10b981' : '#f59e0b' }}
              >
                {joinedCount}/{totalSlots} Hazır
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percentage}%`,
                  background: percentage >= 100 ? '#10b981' : 'linear-gradient(90deg, #10b981, #34d399)',
                  boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                }}
              />
            </div>

            {/* Players + RSVP */}
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {allPlayers.slice(0, 4).map(p => (
                  <img
                    key={p.id}
                    src={p.avatar}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover border-2"
                    style={{ borderColor: '#0f1520' }}
                  />
                ))}
                {allPlayers.length > 4 && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2"
                    style={{ background: '#1e2940', borderColor: '#0f1520', color: 'rgba(255,255,255,0.5)' }}
                  >
                    +{allPlayers.length - 4}
                  </div>
                )}
              </div>

              {/* RSVP Buttons */}
              <div className="flex gap-2">
                {([
                  { status: 'yes',   icon: 'check',         active: '#10b981' },
                  { status: 'maybe', icon: 'question_mark', active: '#f59e0b' },
                  { status: 'no',    icon: 'close',         active: '#ef4444' },
                ] as const).map(btn => (
                  <button
                    key={btn.status}
                    onClick={() => onRsvpChange(btn.status)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center btn-press transition-all"
                    style={{
                      background: rsvpStatus === btn.status ? btn.active : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${rsvpStatus === btn.status ? btn.active : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: rsvpStatus === btn.status ? `0 4px 16px ${btn.active}40` : 'none',
                    }}
                  >
                    <Icon
                      name={btn.icon}
                      size={16}
                      style={{ color: rsvpStatus === btn.status ? '#fff' : 'rgba(255,255,255,0.4)' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Nav Links ── */}
        <div
          className="rounded-3xl overflow-hidden rv rv-5"
          style={{ background: '#0f1520', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { icon: 'settings',      label: 'Ayarlar',         screen: 'settings',       sub: 'Hesap & uygulama' },
            { icon: 'leaderboard',   label: 'Sıralama',        screen: 'leaderboard',    sub: 'En iyi oyuncular' },
            { icon: 'how_to_vote',   label: 'Anketler',        screen: 'polls',          sub: 'Aktif anketler' },
            { icon: 'help_outline',  label: 'Destek',          screen: 'notifications',  sub: 'Yardım & SSS' },
          ].map((item, idx, arr) => (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen as ScreenName)}
              className="w-full flex items-center gap-3 px-4 py-3.5 btn-press text-left transition-colors hover:bg-white/5"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <Icon name={item.icon} size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">{item.label}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.sub}</p>
              </div>
              <Icon name="chevron_right" size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
