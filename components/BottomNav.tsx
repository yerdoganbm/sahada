/**
 * BottomNav — Premium mobile nav
 * Pill indicator animates under active tab
 */
import React from 'react';
import { Icon } from './Icon';
import { ScreenName } from '../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  userRole?: 'admin' | 'member' | 'venue_owner' | 'scout';
  notifCount?: number;
}

const NAV_ITEMS: { id: ScreenName; icon: string; iconFilled: string; label: string; roles: string[] }[] = [
  { id: 'dashboard', icon: 'home',    iconFilled: 'home',    label: 'Ana Sayfa', roles: ['admin', 'member', 'venue_owner', 'scout'] },
  { id: 'venues',    icon: 'stadium', iconFilled: 'stadium', label: 'Sahalar',   roles: ['admin', 'member', 'venue_owner'] },
  { id: 'polls',     icon: 'how_to_vote', iconFilled: 'how_to_vote', label: 'Anketler', roles: ['admin', 'member'] },
  { id: 'profile',   icon: 'person',  iconFilled: 'person',  label: 'Profil',    roles: ['admin', 'member', 'venue_owner', 'scout'] },
];

export function BottomNav({ currentScreen, onNavigate, userRole = 'member', notifCount = 0 }: BottomNavProps) {
  const items = NAV_ITEMS.filter(i => i.roles.includes(userRole));

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        background: 'rgba(10,14,21,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        display: 'flex',
        alignItems: 'center',
        height: 60,
      }}
    >
      {items.map(item => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active pill indicator */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Notification dot for profile/polls */}
            {item.id === 'profile' && notifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6, right: 'calc(50% - 20px)',
                  width: 7, height: 7,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1.5px solid #0a0e15',
                  zIndex: 2,
                }}
              />
            )}

            <Icon
              name={item.iconFilled}
              size={22}
              filled={isActive}
              style={{
                color: isActive ? '#10b981' : 'rgba(255,255,255,0.3)',
                transition: 'color 0.15s ease',
                position: 'relative', zIndex: 1,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? '#10b981' : 'rgba(255,255,255,0.25)',
                letterSpacing: '0.03em',
                lineHeight: 1,
                transition: 'color 0.15s ease',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
