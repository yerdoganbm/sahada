/**
 * Authentication Context
 * Manages user authentication state, JWT token storage, and push token registration
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, TeamProfile } from '../types';
import {
  setApiAuthUserId,
  setApiAuthToken,
  clearApiAuth,
  setApiOnUnauthorized,
} from '../services/api';
import { registerPushTokenIfAvailable } from '../services/push';
import {
  getUserByPhoneOrEmail,
  getUserById,
  createTeamAndUser,
} from '../services/firestore';

const TEAM_STORAGE_KEY = '@sahada_team';
const BIOMETRIC_USER_KEY = '@sahada_biometric_user';
const STORAGE_KEY = '@sahada_user';
const TOKEN_STORAGE_KEY = '@sahada_token';

interface AuthContextType {
  user: Player | null;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  loginWithCredentials: (opts: { phone?: string; email?: string }) => Promise<void>;
  restoreSession: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Player>) => Promise<void>;
  createTeamAndLogin: (team: TeamProfile, founderName: string, founderEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      clearApiAuth();
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(TEAM_STORAGE_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  useEffect(() => {
    setApiOnUnauthorized(logout);
    return () => setApiOnUnauthorized(null);
  }, [logout]);

  // Load saved user and token on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [savedUser, savedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as Player;
        setUser(parsed);
        setApiAuthUserId(parsed.id);
        if (savedToken) {
          setApiAuthToken(savedToken);
          registerPushTokenIfAvailable();
        } else {
          setApiAuthToken(null);
        }
      } else {
        setApiAuthUserId(null);
        setApiAuthToken(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (opts: { phone?: string; email?: string }) => {
    const { phone, email } = opts;
    if (!phone && !email) throw new Error('Telefon veya e-posta gerekli');
    const player = await getUserByPhoneOrEmail(phone, email);
    if (!player) throw new Error('Kullanıcı bulunamadı');
    setUser(player);
    setApiAuthUserId(player.id);
    setApiAuthToken(null);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, player.id);
    registerPushTokenIfAvailable();
    console.log('✅ Logged in (Firestore):', player.name);
  };

  const login = async (userId: string) => {
    const foundUser = await getUserById(userId);
    if (!foundUser) throw new Error('Kullanıcı bulunamadı');
    setUser(foundUser);
    setApiAuthUserId(foundUser.id);
    setApiAuthToken(null);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, foundUser.id);
    console.log('✅ Logged in (Firestore):', foundUser.name);
  };

  const restoreSession = async (userId: string) => {
    const [savedUser, savedToken] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(TOKEN_STORAGE_KEY),
    ]);
    const parsed = savedUser ? (JSON.parse(savedUser) as Player) : null;
    if (parsed && parsed.id === userId) {
      setUser(parsed);
      setApiAuthUserId(parsed.id);
      setApiAuthToken(savedToken || null);
      registerPushTokenIfAvailable();
      console.log('✅ Session restored:', parsed.name);
    } else {
      await login(userId);
    }
  };

  const logoutAsync = async () => {
    await logout();
  };

  const createTeamAndLogin = async (
    team: TeamProfile,
    founderName: string,
    founderEmail?: string
  ) => {
    const { teamId, user: newUser } = await createTeamAndUser(
      {
        name: team.name,
        shortName: team.shortName,
        inviteCode: team.inviteCode ?? `${team.name.slice(0, 3).toUpperCase()}${Date.now().toString(36)}`,
        colors: team.colors,
      },
      founderName,
      founderEmail
    );
    const teamWithId = { ...team, id: teamId };
    await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamWithId));
    setUser(newUser);
    setApiAuthUserId(newUser.id);
    setApiAuthToken(null);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, newUser.id);
    registerPushTokenIfAvailable();
    console.log('✅ Takım kuruldu ve giriş yapıldı (Firestore):', founderName);
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
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithCredentials,
        restoreSession,
        logout: logoutAsync,
        updateUser,
        createTeamAndLogin,
      }}
    >
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
