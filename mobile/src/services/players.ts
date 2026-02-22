/**
 * Oyuncu/Kadro – Firestore ile (mock/API yok)
 */

import type { Player } from '../types';
import {
  getPlayers as getPlayersFromFirestore,
  getPlayer as getPlayerFromFirestore,
  updateUserRole as updateUserRoleFirestore,
  getTeamInviteCode as getTeamInviteCodeFirestore,
  getTeamIdForUser as getTeamIdForUserFirestore,
  addManualPlayer as addManualPlayerFirestore,
} from './firestore';

export async function getPlayers(params?: {
  teamId?: string;
  role?: string;
}): Promise<Player[]> {
  try {
    return await getPlayersFromFirestore(params?.teamId, params?.role);
  } catch (e) {
    console.warn('getPlayers failed', e);
    return [];
  }
}

export async function getPlayer(id: string): Promise<Player | null> {
  try {
    return await getPlayerFromFirestore(id);
  } catch (e) {
    console.warn('getPlayer failed', e);
    return null;
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'member'): Promise<void> {
  await updateUserRoleFirestore(userId, role);
}

export async function getTeamInviteCode(userId: string): Promise<string | null> {
  try {
    return await getTeamInviteCodeFirestore(userId);
  } catch (e) {
    console.warn('getTeamInviteCode failed', e);
    return null;
  }
}

export async function getTeamIdForUser(userId: string): Promise<string | null> {
  try {
    return await getTeamIdForUserFirestore(userId);
  } catch (e) {
    console.warn('getTeamIdForUser failed', e);
    return null;
  }
}

export async function addManualPlayer(
  teamId: string,
  data: { name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }
): Promise<Player | null> {
  try {
    return await addManualPlayerFirestore(teamId, data);
  } catch (e) {
    console.warn('addManualPlayer failed', e);
    return null;
  }
}
