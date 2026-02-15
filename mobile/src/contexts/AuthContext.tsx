/**
 * Authentication Context
 * Manages user authentication state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../types';

interface AuthContextType {
  user: Player | null;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Player>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@sahada_user';

// Mock players for testing (same as web app)
const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    position: 'MID',
    rating: 8.5,
    reliability: 95,
    avatar: 'https://i.pravatar.cc/150?u=1',
    role: 'admin',
    tier: 'partner',
    isCaptain: true,
    phone: '0532 123 45 67',
  },
  {
    id: '7',
    name: 'Burak Yılmaz',
    position: 'FWD',
    rating: 8.0,
    reliability: 90,
    avatar: 'https://i.pravatar.cc/150?u=7',
    role: 'member',
    tier: 'premium',
    isCaptain: true,
    phone: '0532 765 43 21',
  },
  {
    id: '2',
    name: 'Mehmet Demir',
    position: 'DEF',
    rating: 7.2,
    reliability: 88,
    avatar: 'https://i.pravatar.cc/150?u=2',
    role: 'member',
    tier: 'free',
    phone: '0532 111 22 33',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userId: string) => {
    try {
      // Mock login - find user from MOCK_PLAYERS
      const foundUser = MOCK_PLAYERS.find(p => p.id === userId);
      
      if (foundUser) {
        setUser(foundUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
        console.log('✅ Logged in as:', foundUser.name);
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates: Partial<Player>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      console.log('✅ User updated');
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
