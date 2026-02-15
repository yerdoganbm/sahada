/**
 * Maç API servisi - web API ile uyumlu
 */

import api from './api';
import type { Match } from '../types';

export interface CreateMatchPayload {
  date: string;
  time: string;
  venueId: string;
  teamId?: string;
  pricePerPerson?: number;
  capacity?: number;
}

export async function getMatches(params?: {
  teamId?: string;
  status?: string;
  upcoming?: boolean;
}): Promise<Match[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.set('teamId', params.teamId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.upcoming) searchParams.set('upcoming', 'true');
    const qs = searchParams.toString();
    const { data } = await api.get<Match[]>(`/matches${qs ? `?${qs}` : ''}`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('getMatches failed', e);
    return [];
  }
}

export async function getMatch(id: string): Promise<Match | null> {
  try {
    const { data } = await api.get<Match>(`/matches/${id}`);
    return data ?? null;
  } catch (e) {
    console.warn('getMatch failed', e);
    return null;
  }
}

export async function createMatch(payload: CreateMatchPayload): Promise<Match | null> {
  try {
    const { data } = await api.post<Match>('/matches', payload);
    return data ?? null;
  } catch (e) {
    console.warn('createMatch failed', e);
    throw e;
  }
}

/** RSVP: status 'yes'|'no'|'maybe' → API'ye YES|NO|MAYBE gönderilir */
export async function updateMatchRSVP(
  matchId: string,
  playerId: string,
  status: 'yes' | 'no' | 'maybe'
): Promise<void> {
  const apiStatus = status === 'yes' ? 'YES' : status === 'no' ? 'NO' : 'MAYBE';
  await api.post(`/matches/${matchId}/rsvp`, { playerId, status: apiStatus });
}
