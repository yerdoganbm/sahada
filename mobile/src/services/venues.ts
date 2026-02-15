/**
 * Saha API servisi - web API ile uyumlu
 */

import api from './api';
import type { Venue } from '../types';

export async function getVenues(): Promise<Venue[]> {
  try {
    const { data } = await api.get<Venue[]>('/venues');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('getVenues failed', e);
    return [];
  }
}

export async function getVenue(id: string): Promise<Venue | null> {
  try {
    const { data } = await api.get<Venue>(`/venues/${id}`);
    return data ?? null;
  } catch (e) {
    console.warn('getVenue failed', e);
    return null;
  }
}
