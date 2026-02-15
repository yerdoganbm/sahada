/**
 * Sahada Mobile - Web Simulator
 * Runs React Native-like components in browser for quick testing
 */

import React, { useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import MatchesScreen from './screens/MatchesScreen';
import TeamScreen from './screens/TeamScreen';
import ProfileScreen from './screens/ProfileScreen';

type Screen = 'welcome' | 'login' | 'dashboard' | 'matches' | 'team' | 'profile';

interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  tier?: string;
  isCaptain?: boolean;
  rating?: number;
  reliability?: number;
}

function MobileSimulator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [user, setUser] = useState<User | null>(null);

  // Mock users
  const USERS: Record<string, User> = {
    '1': {
      id: '1',
      name: 'Ahmet Yılmaz',
      avatar: 'https://i.pravatar.cc/150?u=1',
      role: 'admin',
      tier: 'partner',
      isCaptain: true,
      rating: 8.5,
      reliability: 95,
    },
    '7': {
      id: '7',
      name: 'Burak Yılmaz',
      avatar: 'https://i.pravatar.cc/150?u=7',
      role: 'member',
      tier: 'premium',
      isCaptain: true,
      rating: 8.0,
      reliability: 90,
    },
    '2': {
      id: '2',
      name: 'Mehmet Demir',
      avatar: 'https://i.pravatar.cc/150?u=2',
      role: 'member',
      tier: 'free',
      rating: 7.2,
      reliability: 88,
    },
  };

  const handleLogin = (phone: string) => {
    let userId = phone;
    if (phone.includes('admin') || phone === '1') userId = '1';
    else if (phone.includes('kaptan') || phone === '7') userId = '7';
    else if (phone === '2') userId = '2';

    const foundUser = USERS[userId];
    if (foundUser) {
      setUser(foundUser);
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('welcome');
  };

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  // Navigation Context Mock
  const navigationContext = {
    navigate,
    goBack: () => setCurrentScreen(user ? 'dashboard' : 'welcome'),
    getParent: () => ({ navigate }),
  };

  // Auth Context Mock
  const authContext = {
    user,
    login: handleLogin,
    logout: handleLogout,
  };

  // Render current screen
  const renderScreen = () => {
    // Wrap screens with contexts
    const screenProps = {
      navigation: navigationContext,
      auth: authContext,
    };

    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen {...screenProps} />;
      case 'login':
        return <LoginScreen {...screenProps} />;
      case 'dashboard':
        return user ? <DashboardScreen {...screenProps} /> : <LoginScreen {...screenProps} />;
      case 'matches':
        return <MatchesScreen {...screenProps} />;
      case 'team':
        return <TeamScreen {...screenProps} />;
      case 'profile':
        return <ProfileScreen {...screenProps} />;
      default:
        return <WelcomeScreen {...screenProps} />;
    }
  };

  return (
    <div style={styles.simulator}>
      <div style={styles.phone}>
        {/* Status Bar */}
        <div style={styles.statusBar}>
          <span style={styles.time}>9:41</span>
          <div style={styles.statusIcons}>
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Screen Content */}
        <div style={styles.screen}>
          {renderScreen()}
        </div>

        {/* Bottom Tabs (when logged in) */}
        {user && (
          <div style={styles.bottomTabs}>
            <button
              style={{
                ...styles.tab,
                ...(currentScreen === 'dashboard' ? styles.tabActive : {}),
              }}
              onClick={() => navigate('dashboard')}
            >
              <span style={styles.tabIcon}>🏠</span>
              <span style={styles.tabLabel}>Ana Sayfa</span>
            </button>
            <button
              style={{
                ...styles.tab,
                ...(currentScreen === 'matches' ? styles.tabActive : {}),
              }}
              onClick={() => navigate('matches')}
            >
              <span style={styles.tabIcon}>⚽</span>
              <span style={styles.tabLabel}>Maçlar</span>
            </button>
            <button
              style={{
                ...styles.tab,
                ...(currentScreen === 'team' ? styles.tabActive : {}),
              }}
              onClick={() => navigate('team')}
            >
              <span style={styles.tabIcon}>👥</span>
              <span style={styles.tabLabel}>Takım</span>
            </button>
            <button
              style={{
                ...styles.tab,
                ...(currentScreen === 'profile' ? styles.tabActive : {}),
              }}
              onClick={() => navigate('profile')}
            >
              <span style={styles.tabIcon}>👤</span>
              <span style={styles.tabLabel}>Profil</span>
            </button>
          </div>
        )}

        {/* Home Indicator (iOS) */}
        <div style={styles.homeIndicator} />
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3>📱 Mobile App Simulator</h3>
        <p>Test için giriş yapın:</p>
        <ul>
          <li><strong>Admin:</strong> "1"</li>
          <li><strong>Kaptan:</strong> "7"</li>
          <li><strong>Üye:</strong> "2"</li>
        </ul>
        <p><small>💡 Bu simulator React Native app'in web preview'udur.</small></p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  simulator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1e293b',
    padding: '20px',
    gap: '20px',
  },
  phone: {
    width: '390px',
    height: '844px',
    backgroundColor: '#0B0F1A',
    borderRadius: '40px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    position: 'relative',
    border: '8px solid #1e293b',
  },
  statusBar: {
    height: '44px',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '10px',
  },
  time: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
  },
  statusIcons: {
    display: 'flex',
    gap: '6px',
    fontSize: '14px',
  },
  screen: {
    flex: 1,
    overflow: 'auto',
    height: 'calc(844px - 44px - 83px - 34px)',
  },
  bottomTabs: {
    height: '83px',
    backgroundColor: '#0B0F1A',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'row',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    transform: 'scale(1.05)',
  },
  tabIcon: {
    fontSize: '24px',
  },
  tabLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
  },
  homeIndicator: {
    width: '140px',
    height: '5px',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: '3px',
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  instructions: {
    backgroundColor: '#1e293b',
    padding: '20px',
    borderRadius: '12px',
    color: '#94a3b8',
    maxWidth: '390px',
    fontSize: '14px',
  },
};

export default MobileSimulator;
