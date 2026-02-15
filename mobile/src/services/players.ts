/**
 * Oyuncu/Kadro API servisi - web API ile uyumlu
 */

import api from './api';
import type { Player } from '../types';

export async function getPlayers(params?: {
  teamId?: string;
  role?: string;
}): Promise<Player[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.set('teamId', params.teamId);
    if (params?.role) searchParams.set('role', params.role);
    const qs = searchParams.toString();
    const { data } = await api.get<Player[]>(`/players${qs ? `?${qs}` : ''}`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('getPlayers failed', e);
    return [];
  }
}

export async function getPlayer(id: string): Promise<Player | null> {
  try {
    const { data } = await api.get<Player>(`/players/${id}`);
    return data ?? null;
  } catch (e) {
    console.warn('getPlayer failed', e);
    return null;
  }
}
