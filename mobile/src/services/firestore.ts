/**
 * Firestore veri katmani – mock/API yerine Firebase Firestore kullanir.
 * Koleksiyonlar: users, teams, matches, venues (Firebase Console'da olusturun).
 */

import firestore from '@react-native-firebase/firestore';
import type { Player, Match, Venue } from '../types';

const COLLECTIONS = {
  users: 'users',
  teams: 'teams',
  matches: 'matches',
  venues: 'venues',
  notifications: 'notifications',
} as const;

export interface NotificationItem {
  id: string;
  type: 'match' | 'payment' | 'squad' | 'social' | 'system';
  title: string;
  body: string;
  read: boolean;
  time?: string;
  createdAt?: unknown;
}

type DocSnap = { id: string; data: () => Record<string, unknown> | undefined; exists: boolean };

function docToUser(doc: DocSnap): Player {
  const d = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    name: d.name ?? '',
    position: (d.position as Player['position']) ?? 'MID',
    rating: typeof d.rating === 'number' ? d.rating : 7,
    reliability: typeof d.reliability === 'number' ? d.reliability : 100,
    avatar: d.avatar ?? `https://i.pravatar.cc/150?u=${doc.id}`,
    role: (d.role as Player['role']) ?? 'member',
    phone: d.phone,
    email: d.email,
    tier: d.tier,
    isCaptain: d.isCaptain,
    shirtNumber: d.shirtNumber,
  };
}

function docToMatch(doc: DocSnap): Match {
  const d = (doc.data() || {}) as Record<string, unknown>;
  const date = d.matchDate ?? d.date ?? '';
  const time = d.matchTime ?? d.time ?? '';
  return {
    id: doc.id,
    date: typeof date === 'string' ? date : (date?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? ''),
    time: typeof time === 'string' ? time : '',
    location: d.location ?? '',
    venue: d.venue ?? '',
    status: (d.status as Match['status']) ?? 'upcoming',
    score: d.score,
    teamId: d.teamId,
    venueId: d.venueId,
    capacity: d.capacity,
    waitlistEnabled: d.waitlistEnabled,
    attendees: Array.isArray(d.attendees) ? d.attendees : [],
    mvpVotes: d.mvpVotes,
    mvpWinner: d.mvpWinner,
  };
}

function docToVenue(doc: DocSnap): Venue {
  const d = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    name: d.name ?? '',
    location: d.location ?? d.address ?? '',
    pricePerHour: typeof d.pricePerHour === 'number' ? d.pricePerHour : 0,
    rating: typeof d.rating === 'number' ? d.rating : 0,
    image: d.primaryImageUrl ?? d.image ?? '',
    features: Array.isArray(d.features) ? d.features : [],
    coordinates: d.coordinates,
  };
}

/** TR telefon: 0532... veya 532... olarak kayıtlı olabilir */
function normalizePhone(p: string): string[] {
  const s = p.replace(/\D/g, '');
  if (s.startsWith('90') && s.length >= 12) return [s, s.slice(2), '0' + s.slice(2)];
  if (s.startsWith('0')) return [s, s.slice(1)];
  return [s, '0' + s];
}

/** Telefon veya email ile kullanici bulur (ilk eslesen). */
export async function getUserByPhoneOrEmail(phone?: string, email?: string): Promise<Player | null> {
  const col = firestore().collection(COLLECTIONS.users);
  if (phone) {
    for (const p of normalizePhone(phone.trim())) {
      const snap = await col.where('phone', '==', p).limit(1).get();
      if (!snap.empty) return docToUser(snap.docs[0]);
    }
  }
  if (email) {
    const snap = await col.where('email', '==', email).limit(1).get();
    if (!snap.empty) return docToUser(snap.docs[0]);
  }
  return null;
}

export async function getUserById(id: string): Promise<Player | null> {
  const doc = await firestore().collection(COLLECTIONS.users).doc(id).get();
  if (!doc.exists) return null;
  return docToUser(doc);
}

export async function getPlayers(teamId?: string, role?: string): Promise<Player[]> {
  let q = firestore().collection(COLLECTIONS.users);
  if (teamId) q = q.where('teamId', '==', teamId);
  if (role) q = q.where('role', '==', role);
  const snap = await q.get();
  return snap.docs.map(docToUser);
}

export async function getPlayer(id: string): Promise<Player | null> {
  return getUserById(id);
}

export async function getMatches(params?: {
  teamId?: string;
  status?: string;
  upcoming?: boolean;
}): Promise<Match[]> {
  let q = firestore().collection(COLLECTIONS.matches);
  if (params?.teamId) q = q.where('teamId', '==', params.teamId);
  if (params?.status) q = q.where('status', '==', params.status);
  q = q.orderBy('matchDate', 'desc');
  const snap = await q.get();
  let list = snap.docs.map(docToMatch);
  if (params?.upcoming) {
    const today = new Date().toISOString().slice(0, 10);
    list = list.filter((m) => m.date >= today && m.status === 'upcoming');
  }
  return list;
}

export async function getMatch(id: string): Promise<Match | null> {
  const doc = await firestore().collection(COLLECTIONS.matches).doc(id).get();
  if (!doc.exists) return null;
  return docToMatch(doc);
}

export async function getVenues(): Promise<Venue[]> {
  const snap = await firestore().collection(COLLECTIONS.venues).get();
  return snap.docs.map(docToVenue);
}

export async function getVenue(id: string): Promise<Venue | null> {
  const doc = await firestore().collection(COLLECTIONS.venues).doc(id).get();
  if (!doc.exists) return null;
  return docToVenue(doc);
}

export interface CreateMatchPayload {
  date: string;
  time: string;
  venueId: string;
  teamId?: string;
  location?: string;
  pricePerPerson?: number;
  capacity?: number;
}

export async function createMatch(payload: CreateMatchPayload): Promise<Match | null> {
  const venueSnap = await firestore().collection(COLLECTIONS.venues).doc(payload.venueId).get();
  const venueName = venueSnap.exists ? (venueSnap.data()?.name ?? '') : '';
  const ref = await firestore()
    .collection(COLLECTIONS.matches)
    .add({
      teamId: payload.teamId ?? null,
      venueId: payload.venueId,
      matchDate: payload.date,
      matchTime: payload.time,
      date: payload.date,
      time: payload.time,
      location: payload.location ?? venueName,
      venue: venueName,
      status: 'upcoming',
      pricePerPerson: payload.pricePerPerson ?? 0,
      capacity: payload.capacity ?? 14,
      attendees: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  return getMatch(ref.id);
}

/** Maç RSVP gunceller (attendees dizisine ekler/gunceller). */
export async function updateMatchRSVP(
  matchId: string,
  playerId: string,
  status: 'YES' | 'NO' | 'MAYBE'
): Promise<void> {
  const ref = firestore().collection(COLLECTIONS.matches).doc(matchId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Match not found');
  const attendees: Array<{ playerId: string; status: string }> = Array.isArray(doc.data()?.attendees)
    ? [...doc.data()!.attendees]
    : [];
  const idx = attendees.findIndex((a) => a.playerId === playerId);
  if (idx >= 0) attendees[idx].status = status;
  else attendees.push({ playerId, status });
  await ref.update({ attendees });
}

/** Takim olusturur ve kurucuyu users'a ekler; kurucu bilgisi ile Player dondurur. */
export async function createTeamAndUser(
  team: { name: string; shortName?: string; inviteCode: string; colors?: [string, string] },
  founderName: string,
  founderEmail?: string,
  founderPhone?: string
): Promise<{ teamId: string; user: Player }> {
  const teamsRef = firestore().collection(COLLECTIONS.teams);
  const teamRef = await teamsRef.add({
    name: team.name,
    shortName: team.shortName ?? team.name.slice(0, 3),
    inviteCode: team.inviteCode,
    primaryColor: team.colors?.[0] ?? '#10B981',
    secondaryColor: team.colors?.[1] ?? '#0B0F1A',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  const teamId = teamRef.id;
  const usersRef = firestore().collection(COLLECTIONS.users);
  const userRef = await usersRef.add({
    teamId,
    name: founderName,
    email: founderEmail ?? null,
    phone: founderPhone ?? null,
    role: 'admin',
    isCaptain: true,
    position: 'MID',
    rating: 7,
    reliability: 100,
    avatar: `https://i.pravatar.cc/150?u=${founderName}`,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  const user = await getUserById(userRef.id);
  if (!user) throw new Error('User creation failed');
  return { teamId, user };
}

/** Kullanici rolunu gunceller (admin/member). */
export async function updateUserRole(userId: string, role: 'admin' | 'member'): Promise<void> {
  await firestore().collection(COLLECTIONS.users).doc(userId).update({ role });
}

/** Kullaniciya ait takimin inviteCode'unu dondurur. */
export async function getTeamInviteCode(userId: string): Promise<string | null> {
  const userDoc = await firestore().collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) return null;
  const teamId = userDoc.data()?.teamId as string | undefined;
  if (!teamId) return null;
  const teamDoc = await firestore().collection(COLLECTIONS.teams).doc(teamId).get();
  if (!teamDoc.exists) return null;
  return (teamDoc.data()?.inviteCode as string) ?? null;
}

/** Kullanicinin teamId'sini dondurur. */
export async function getTeamIdForUser(userId: string): Promise<string | null> {
  const userDoc = await firestore().collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) return null;
  return (userDoc.data()?.teamId as string) ?? null;
}

/** Kullanıcının bildirimlerini getirir. (userId/teamId ileride filtre için – şu an tüm bildirimler) */
export async function getNotifications(
  _userId?: string,
  _teamId?: string
): Promise<NotificationItem[]> {
  const col = firestore().collection(COLLECTIONS.notifications);
  const snap = await col.orderBy('createdAt', 'desc').limit(50).get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    const body = (d.message ?? d.body ?? '') as string;
    const read = (d.isRead ?? d.read ?? false) as boolean;
    let time = (d.time ?? '') as string;
    if (!time && d.createdAt) {
      const ts = (d.createdAt as { toDate?: () => Date })?.toDate?.();
      if (ts) {
        const diff = Date.now() - ts.getTime();
        if (diff < 60000) time = 'Az önce';
        else if (diff < 3600000) time = `${Math.floor(diff / 60000)} dk önce`;
        else if (diff < 86400000) time = `${Math.floor(diff / 3600000)} saat önce`;
        else time = `${Math.floor(diff / 86400000)} gün önce`;
      }
    }
    return {
      id: doc.id,
      type: ((d.type as string) || 'system') as NotificationItem['type'],
      title: (d.title as string) ?? '',
      body,
      read,
      time,
      createdAt: d.createdAt,
    };
  });
}

/** Manuel oyuncu ekler (uygulama kullanmayan biri). */
export async function addManualPlayer(
  teamId: string,
  data: { name: string; position: 'GK' | 'DEF' | 'MID' | 'FWD' }
): Promise<Player | null> {
  const ref = await firestore().collection(COLLECTIONS.users).add({
    teamId,
    name: data.name,
    position: data.position,
    role: 'member',
    rating: 6,
    reliability: 100,
    avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return getUserById(ref.id);
}
