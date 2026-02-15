/**
 * Mobile Bottom Navigation Component
 * Shows fixed bottom navigation on mobile devices
 */

import React from 'react';
import { Icon } from './Icon';
import { ScreenName } from '../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  userRole?: 'admin' | 'member' | 'venue_owner' | 'scout';
}

export function BottomNav({ currentScreen, onNavigate, userRole = 'member' }: BottomNavProps) {
  const navItems = [
    {
      id: 'venues' as ScreenName,
      icon: 'stadium',
      label: 'Sahalar', 
      roles: ['admin', 'member', 'venue_owner']
    },
    { 
      id: 'polls' as ScreenName, 
      icon: 'poll', 
      label: 'Anketler',
      roles: ['admin', 'member']
    },
    { 
      id: 'profile' as ScreenName, 
      icon: 'person', 
      label: 'Profil',
      roles: ['admin', 'member', 'venue_owner', 'scout']
    },
  ];

  // Filter items based on user role
  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="bottom-nav mobile-only safe-bottom">
      {filteredItems.map((item) => (
        <button
          key={item.id}
          className={`bottom-nav-item tap-highlight ${currentScreen === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-label={item.label}
        >
          <Icon name={item.icon} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
