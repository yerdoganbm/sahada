/**
 * ProfileMenu — Universal floating profile & logout menu
 * Used across: CaptainDashboard, MemberHome, VenueOwnerDashboard
 */
import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';

interface Props {
  user: Player;
  onLogout: () => void;
  onNavigate?: (screen: string) => void;
  accentColor?: string;
}

const roleLabel: Record<string, string> = {
  admin: '🛡 Admin',
  captain: '🏆 Kaptan',
  member: '⚽ Oyuncu',
  venue_owner: '🏟 Saha Sahibi',
  venue_staff: '👷 Personel',
  venue_accountant: '📊 Muhasebe',
};

export const ProfileMenu: React.FC<Props> = ({ user, onLogout, onNavigate, accentColor = '#10B981' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes pm-menu { from{opacity:0;transform:translateY(-8px) scale(0.96)}to{opacity:1;transform:none} }
        .pm-menu { animation: pm-menu 0.18s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div ref={ref} className="relative">
        {/* avatar trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all active:scale-[0.97]"
          style={{
            background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          {/* avatar */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[13px] flex-shrink-0"
            style={{ background: `${accentColor}25`, color: accentColor, border: `1.5px solid ${accentColor}40` }}>
            {user.avatar && !user.avatar.includes('dicebear') && !user.avatar.includes('pravatar') ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : initials}
          </div>
          <div className="text-left min-w-0">
            <p className="text-white text-[12px] font-black leading-none truncate max-w-[80px]">{user.name || 'Kullanıcı'}</p>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: accentColor }}>{roleLabel[user.role ?? ''] ?? user.role}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* dropdown */}
        {open && (
          <div className="pm-menu absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            {/* user info header */}
            <div className="px-4 py-3.5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: `${accentColor}20`, color: accentColor }}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-black truncate">{user.name || 'Kullanıcı'}</p>
                  <p className="text-[10px] font-bold truncate" style={{ color: accentColor }}>{roleLabel[user.role ?? ''] ?? user.role}</p>
                </div>
              </div>
            </div>

            {/* menu items */}
            <div className="py-1.5">
              {onNavigate && (
                <>
                  <MenuItem icon="👤" label="Profil" onClick={() => { onNavigate('profile'); setOpen(false); }} />
                  <MenuItem icon="⚙️" label="Ayarlar" onClick={() => { onNavigate('settings'); setOpen(false); }} />
                  <div className="mx-3 my-1.5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </>
              )}
              <MenuItem
                icon="🚪"
                label="Çıkış Yap"
                onClick={() => {
                  setOpen(false);
                  if (window.confirm('Çıkış yapmak istiyor musunuz?')) onLogout();
                }}
                danger
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const MenuItem: React.FC<{ icon: string; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
    style={{ color: danger ? '#EF4444' : 'rgba(255,255,255,0.7)' }}>
    <span className="text-sm w-5 text-center">{icon}</span>
    <span className="text-[12px] font-bold">{label}</span>
  </button>
);
