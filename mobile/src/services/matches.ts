/**
 * Maç – Firestore ile (mock/API yok)
 */

import type { Match } from '../types';
import {
  getMatches as getMatchesFromFirestore,
  getMatch as getMatchFromFirestore,
  createMatch as createMatchInFirestore,
  type CreateMatchPayload,
} from './firestore';
import { rsvp as rsvpTxn } from './rsvpService';
import { callFunction } from './functions';

export type { CreateMatchPayload };

export async function getMatches(params?: {
  teamId?: string;
  status?: string;
  upcoming?: boolean;
}): Promise<Match[]> {
  try {
    return await getMatchesFromFirestore(params);
  } catch (e) {
    console.warn('getMatches failed', e);
    return [];
  }
}

export async function getMatch(id: string): Promise<Match | null> {
  try {
    return await getMatchFromFirestore(id);
  } catch (e) {
    console.warn('getMatch failed', e);
    return null;
  }
}

export async function createMatch(payload: CreateMatchPayload): Promise<Match | null> {
  try {
    return await createMatchInFirestore(payload);
  } catch (e) {
    console.warn('createMatch failed', e);
    throw e;
  }
}

export async function updateMatchRSVP(
  matchId: string,
  playerId: string,
  status: 'yes' | 'no' | 'maybe'
): Promise<void> {
  const desiredState = status === 'yes' ? 'GOING' : status === 'no' ? 'NOT_GOING' : 'MAYBE';
  try {
    await callFunction('rsvp', { matchId, desiredState });
    return;
  } catch (e) {
    // Fallback keeps app usable in dev environments without Functions configured.
    console.warn('functions.rsvp failed; falling back to client txn', e);
    await rsvpTxn({ matchId, userId: playerId, desiredState });
  }
}
