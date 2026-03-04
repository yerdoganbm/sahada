/**
 * PhoneAuth — Thin wrapper that reuses LoginScreen premium auth flow
 * Used for: join-code flow, captain signup from WelcomeScreen
 */
import React from 'react';
import { Player } from '../types';
import { LoginScreen } from './LoginScreen';

interface Props {
  pendingJoinCode?: string | null;
  pendingRole?: 'captain' | 'member' | null;
  onLoginSuccess: (user: Player) => void;
  onBack: () => void;
}

export const PhoneAuth: React.FC<Props> = ({ pendingJoinCode, pendingRole, onLoginSuccess, onBack }) => {
  return (
    <LoginScreen
      onLogin={(userId: string) => {
        // Build a minimal Player object from userId for the callback
        const phone = userId.replace(/^new_player_/, '');
        const player: Player = {
          id: userId.startsWith('new_player_') ? 'u_' + phone.slice(-8) + '_' + Date.now() : userId,
          name: pendingRole === 'captain' ? 'Kaptan' : 'Yeni Üye',
          phone,
          role: pendingRole === 'captain' ? ('captain' as any) : 'member',
          tier: 'free',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=U`,
          position: 'MID',
          rating: 0, reliability: 80, goals: 0, assists: 0, matchesPlayed: 0,
          joinDate: new Date().toISOString(), isActive: true,
        } as any;
        onLoginSuccess(player);
      }}
      onNavigate={(_screen: string) => onBack()}
      pendingJoinCode={pendingJoinCode}
      pendingRole={pendingRole}
    />
  );
};
