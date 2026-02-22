/**
 * Saha – Firestore ile (mock/API yok)
 */

import type { Venue } from '../types';
import { getVenues as getVenuesFromFirestore, getVenue as getVenueFromFirestore } from './firestore';

export async function getVenues(): Promise<Venue[]> {
  try {
    return await getVenuesFromFirestore();
  } catch (e) {
    console.warn('getVenues failed', e);
    return [];
  }
}

export async function getVenue(id: string): Promise<Venue | null> {
  try {
    return await getVenueFromFirestore(id);
  } catch (e) {
    console.warn('getVenue failed', e);
    return null;
  }
}
