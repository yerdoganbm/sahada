/**
 * Oyuncu/Kadro – Firestore ile (mock/API yok)
 */

import type { Player } from '../types';
import {
  getPlayers as getPlayersFromFirestore,
  getPlayer as getPlayerFromFirestore,
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
