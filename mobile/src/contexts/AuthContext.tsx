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
  getTeamById,
  getTeamByInviteCode,
  setUserActiveTeamId,
  updateUserInFirestore,
  ensureLegacyMembership,
  getActiveMembershipsForUser,
  updateUserAuthzFields,
  type MembershipItem,
} from '../services/firestore';
import { acceptInvite } from '../services/inviteService';
import { requestJoin } from '../services/joinRequestService';

const TEAM_STORAGE_KEY = '@sahada_team';
const BIOMETRIC_USER_KEY = '@sahada_biometric_user';
const STORAGE_KEY = '@sahada_user';
const TOKEN_STORAGE_KEY = '@sahada_token';

interface AuthContextType {
  user: Player | null;
  memberships: MembershipItem[];
  activeTeamId: string | null;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  loginWithCredentials: (opts: { phone?: string; email?: string }) => Promise<void>;
  restoreSession: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Player>) => Promise<void>;
  createTeamAndLogin: (team: TeamProfile, founderName: string, founderEmail?: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<{ status: 'ACTIVE' | 'REQUESTED'; teamId: string }>;
  switchActiveTeam: (teamId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrapMembershipState = useCallback(async (player: Player): Promise<Player> => {
    // Migration: legacy users.teamId/users.role -> memberships
    try {
      const migrationVersion = player.authzMigrationVersion ?? 0;
      if (player.teamId && migrationVersion < 1) {
        await ensureLegacyMembership(player);
        await updateUserAuthzFields(player.id, {
          activeTeamId: player.activeTeamId ?? player.teamId,
          authzMigrationVersion: 1,
        });
        const refreshed = await getUserById(player.id);
        if (refreshed) player = refreshed;
      }

      const active = await getActiveMembershipsForUser(player.id);
      setMemberships(active);

      const inferredActiveTeamId =
        player.activeTeamId ?? player.teamId ?? (active.length > 0 ? active[0].teamId : null);
      setActiveTeamId(inferredActiveTeamId ?? null);

      if (!player.activeTeamId && inferredActiveTeamId) {
        await updateUserAuthzFields(player.id, { activeTeamId: inferredActiveTeamId });
        player = { ...player, activeTeamId: inferredActiveTeamId };
      }

      return player;
    } catch (e) {
      console.warn('bootstrapMembershipState failed', e);
      return player;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setMemberships([]);
      setActiveTeamId(null);
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
        const bootstrapped = await bootstrapMembershipState(parsed);
        setUser(bootstrapped);
        setApiAuthUserId(parsed.id);
        if (savedToken) {
          setApiAuthToken(savedToken);
          registerPushTokenIfAvailable();
        } else {
          setApiAuthToken(null);
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bootstrapped));
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
    const found = await getUserByPhoneOrEmail(phone, email);
    const player = found ? await bootstrapMembershipState(found) : null;
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
    const foundUserRaw = await getUserById(userId);
    const foundUser = foundUserRaw ? await bootstrapMembershipState(foundUserRaw) : null;
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
      const bootstrapped = await bootstrapMembershipState(parsed);
      setUser(bootstrapped);
      setApiAuthUserId(parsed.id);
      setApiAuthToken(savedToken || null);
      registerPushTokenIfAvailable();
      console.log('✅ Session restored:', bootstrapped.name);
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
        colors: [
          team.colors?.[0] ?? '#10B981',
          team.colors?.[1] ?? '#0B0F1A',
        ] as [string, string],
      },
      founderName,
      founderEmail
    );
    const teamWithId = { ...team, id: teamId };
    await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamWithId));
    const bootstrapped = await bootstrapMembershipState(newUser);
    setUser(bootstrapped);
    setApiAuthUserId(newUser.id);
    setApiAuthToken(null);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bootstrapped));
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, newUser.id);
    registerPushTokenIfAvailable();
    console.log('✅ Takım kuruldu ve giriş yapıldı (Firestore):', founderName);
  };

  const updateUser = async (updates: Partial<Player>) => {
    if (!user) return;
    try {
      await updateUserInFirestore(user.id, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      console.log('✅ User updated');
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const joinTeam = async (
    inviteCode: string
  ): Promise<{ status: 'ACTIVE' | 'REQUESTED'; teamId: string }> => {
    if (!user) throw new Error('Giriş yapmanız gerekiyor');
    const code = inviteCode.trim().toUpperCase();
    if (!code) throw new Error('Geçersiz davet kodu');

    // 1) Prefer one-time invite token flow (invites/tokenHash).
    try {
      const accepted = await acceptInvite({ token: code, userId: user.id });
      await updateUserAuthzFields(user.id, { activeTeamId: accepted.teamId, authzMigrationVersion: 1 });
      const updatedUser = await bootstrapMembershipState({
        ...user,
        teamId: accepted.teamId,
        activeTeamId: accepted.teamId,
        authzMigrationVersion: 1,
      });
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

      const t = await getTeamById(accepted.teamId);
      if (t) {
        await AsyncStorage.setItem(
          TEAM_STORAGE_KEY,
          JSON.stringify({
            id: t.id,
            name: t.name,
            shortName: t.shortName ?? t.name.slice(0, 3),
            inviteCode: t.inviteCode,
            colors: [t.primaryColor ?? '#10B981', t.secondaryColor ?? '#0B0F1A'],
          })
        );
      }
      console.log('✅ Davet kabul edildi:', accepted.teamId);
      return { status: 'ACTIVE', teamId: accepted.teamId };
    } catch (e) {
      // Only fall back to legacy team invite code if the token isn't found.
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('invite_not_found')) throw e;
    }

    // 2) Legacy join-by-team invite code: create canonical membership via join policy.
    const team = await getTeamByInviteCode(code);
    if (!team) throw new Error('Geçersiz davet kodu');

    const res = await requestJoin({ teamId: team.id, userId: user.id });
    if (res.status === 'REQUESTED') {
      console.log('🕒 Katılım isteği gönderildi:', team.id);
      return { status: 'REQUESTED', teamId: team.id };
    }

    await updateUserAuthzFields(user.id, { activeTeamId: team.id, authzMigrationVersion: 1 });
    const updatedUser = await bootstrapMembershipState({
      ...user,
      teamId: team.id,
      activeTeamId: team.id,
      authzMigrationVersion: 1,
    });
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    await AsyncStorage.setItem(
      TEAM_STORAGE_KEY,
      JSON.stringify({
        id: team.id,
        name: team.name,
        shortName: team.shortName ?? team.name.slice(0, 3),
        inviteCode: team.inviteCode,
        colors: [team.primaryColor ?? '#10B981', team.secondaryColor ?? '#0B0F1A'],
      })
    );
    console.log('✅ Takıma katıldı:', team.name);
    return { status: 'ACTIVE', teamId: team.id };
  };

  const switchActiveTeam = async (teamId: string) => {
    if (!user) throw new Error('Giriş yapmanız gerekiyor');
    const has = memberships.some((m) => m.teamId === teamId && m.status === 'ACTIVE');
    if (!has) throw new Error('Bu takıma ait aktif üyelik bulunamadı');

    // Backward compatibility: keep legacy `teamId` in sync with `activeTeamId`.
    await setUserActiveTeamId(user.id, teamId);
    await updateUserAuthzFields(user.id, { authzMigrationVersion: 1 });
    const updatedUser = { ...user, activeTeamId: teamId, teamId };
    setUser(updatedUser);
    setActiveTeamId(teamId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    const t = await getTeamById(teamId);
    if (t) {
      await AsyncStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify({
        id: t.id,
        name: t.name,
        shortName: t.shortName ?? t.name.slice(0, 3),
        inviteCode: t.inviteCode,
        colors: [t.primaryColor ?? '#10B981', t.secondaryColor ?? '#0B0F1A'],
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        activeTeamId,
        isLoading,
        login,
        loginWithCredentials,
        restoreSession,
        logout: logoutAsync,
        updateUser,
        createTeamAndLogin,
        joinTeam,
        switchActiveTeam,
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
