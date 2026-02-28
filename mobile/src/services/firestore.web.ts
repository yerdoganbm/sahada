/**
 * Firestore Web – Firebase JS SDK ile (react-native-firebase web'de calismaz)
 * Native ile aynı Firestore projesini kullanır (sahada-16b2d)
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Player, Match, Venue } from '../types';

// Firebase Web – Firestore için minimal config (Firebase Console > Proje Ayarları > Genel > Web uygulaması ekle)
const firebaseConfig = {
  apiKey: 'AIzaSyDdJW7a8KKQsiYhpZFCDK9gzCzzC0Dz8HQ',
  authDomain: 'sahada-16b2d.firebaseapp.com',
  projectId: 'sahada-16b2d',
  storageBucket: 'sahada-16b2d.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  users: 'users',
  teams: 'teams',
  matches: 'matches',
  venues: 'venues',
} as const;

type DocSnap = DocumentSnapshot | QueryDocumentSnapshot;

function docToUser(snap: DocSnap): Player {
  const d = snap.data() || {};
  return {
    id: snap.id,
    name: (d.name as string) ?? '',
    position: (d.position as Player['position']) ?? 'MID',
    rating: typeof d.rating === 'number' ? d.rating : 7,
    reliability: typeof d.reliability === 'number' ? d.reliability : 100,
    avatar: (d.avatar as string) ?? `https://i.pravatar.cc/150?u=${snap.id}`,
    role: (d.role as Player['role']) ?? 'member',
    phone: d.phone,
    email: d.email,
    tier: d.tier,
    isCaptain: d.isCaptain,
    shirtNumber: d.shirtNumber,
  };
}

function docToMatch(snap: DocSnap): Match {
  const d = snap.data() || {};
  const date = d.matchDate ?? d.date ?? '';
  const time = d.matchTime ?? d.time ?? '';
  const dateVal = typeof date === 'string' ? date : (date?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '');
  return {
    id: snap.id,
    date: dateVal,
    time: typeof time === 'string' ? time : '',
    location: (d.location as string) ?? '',
    venue: (d.venue as string) ?? '',
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

function docToVenue(snap: DocSnap): Venue {
  const d = snap.data() || {};
  return {
    id: snap.id,
    name: (d.name as string) ?? '',
    location: (d.location as string) ?? (d.address as string) ?? '',
    pricePerHour: typeof d.pricePerHour === 'number' ? d.pricePerHour : 0,
    rating: typeof d.rating === 'number' ? d.rating : 0,
    image: (d.primaryImageUrl as string) ?? (d.image as string) ?? '',
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

export async function getUserByPhoneOrEmail(phone?: string, email?: string): Promise<Player | null> {
  const usersCol = collection(db, COLLECTIONS.users);
  if (phone) {
    for (const p of normalizePhone(phone.trim())) {
      const q = query(usersCol, where('phone', '==', p), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return docToUser(snap.docs[0]);
    }
  }
  if (email) {
    const q = query(usersCol, where('email', '==', email), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return docToUser(snap.docs[0]);
  }
  return null;
}

export async function getUserById(id: string): Promise<Player | null> {
  const docRef = doc(db, COLLECTIONS.users, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToUser(snap);
}

export async function getPlayers(teamId?: string, role?: string): Promise<Player[]> {
  const usersCol = collection(db, COLLECTIONS.users);
  const constraints = [];
  if (teamId) constraints.push(where('teamId', '==', teamId));
  if (role) constraints.push(where('role', '==', role));
  const q = query(usersCol, ...constraints);
  const snap = await getDocs(q);
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
  const matchesCol = collection(db, COLLECTIONS.matches);
  const constraints: ReturnType<typeof where>[] = [];
  if (params?.teamId) constraints.push(where('teamId', '==', params.teamId));
  if (params?.status) constraints.push(where('status', '==', params.status));
  constraints.push(orderBy('matchDate', 'desc'));
  const q = query(matchesCol, ...constraints);
  const snap = await getDocs(q);
  let list = snap.docs.map(docToMatch);
  if (params?.upcoming) {
    const today = new Date().toISOString().slice(0, 10);
    list = list.filter((m) => m.date >= today && m.status === 'upcoming');
  }
  return list;
}

export async function getMatch(id: string): Promise<Match | null> {
  const docRef = doc(db, COLLECTIONS.matches, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToMatch(snap);
}

export async function getVenues(): Promise<Venue[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.venues));
  return snap.docs.map(docToVenue);
}

export async function getVenue(id: string): Promise<Venue | null> {
  const docRef = doc(db, COLLECTIONS.venues, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToVenue(snap);
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
  const venueSnap = await getDoc(doc(db, COLLECTIONS.venues, payload.venueId));
  const venueName = venueSnap.exists() ? (venueSnap.data()?.name ?? '') : '';
  const ref = await addDoc(collection(db, COLLECTIONS.matches), {
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
    createdAt: serverTimestamp(),
  });
  return getMatch(ref.id);
}

export async function updateMatchRSVP(
  matchId: string,
  playerId: string,
  status: 'YES' | 'NO' | 'MAYBE'
): Promise<void> {
  const ref = doc(db, COLLECTIONS.matches, matchId);
  const docSnap = await getDoc(ref);
  if (!docSnap.exists()) throw new Error('Match not found');
  const attendees: Array<{ playerId: string; status: string }> = Array.isArray(docSnap.data()?.attendees)
    ? [...docSnap.data()!.attendees]
    : [];
  const idx = attendees.findIndex((a) => a.playerId === playerId);
  if (idx >= 0) attendees[idx].status = status;
  else attendees.push({ playerId, status });
  await updateDoc(ref, { attendees });
}

export async function createTeamAndUser(
  team: { name: string; shortName?: string; inviteCode: string; colors?: [string, string] },
  founderName: string,
  founderEmail?: string,
  founderPhone?: string
): Promise<{ teamId: string; user: Player }> {
  const teamsRef = collection(db, COLLECTIONS.teams);
  const teamRef = await addDoc(teamsRef, {
    name: team.name,
    shortName: team.shortName ?? team.name.slice(0, 3),
    inviteCode: team.inviteCode,
    primaryColor: team.colors?.[0] ?? '#10B981',
    secondaryColor: team.colors?.[1] ?? '#0B0F1A',
    joinPolicy: 'OPEN',
    createdAt: serverTimestamp(),
  });
  const teamId = teamRef.id;
  const usersRef = collection(db, COLLECTIONS.users);
  const userRef = await addDoc(usersRef, {
    teamId,
    activeTeamId: teamId,
    name: founderName,
    email: founderEmail ?? null,
    phone: founderPhone ?? null,
    role: 'admin',
    isCaptain: true,
    position: 'MID',
    rating: 7,
    reliability: 100,
    avatar: `https://i.pravatar.cc/150?u=${founderName}`,
    authzMigrationVersion: 1,
    createdAt: serverTimestamp(),
  });

  // Canonical single owner.
  await updateDoc(doc(db, COLLECTIONS.teams, teamId), {
    ownerId: userRef.id,
    updatedAt: serverTimestamp(),
    updatedBy: userRef.id,
  });

  // Canonical membership doc.
  await setDoc(doc(db, 'memberships', `${teamId}_${userRef.id}`), {
    teamId,
    userId: userRef.id,
    roleId: 'TEAM_OWNER',
    status: 'ACTIVE',
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userRef.id,
    previousStatus: null,
    bannedRoleSnapshot: null,
  });

  const user = await getUserById(userRef.id);
  if (!user) throw new Error('User creation failed');
  return { teamId, user };
}

/** Telefonu tek formatta saklamak icin; getUserByPhoneOrEmail ile bulunabilir olmali. */
function canonicalPhone(p: string): string {
  const s = p.replace(/\D/g, '');
  if (s.startsWith('90') && s.length >= 12) return s.slice(0, 12);
  if (s.startsWith('0') && s.length >= 11) return s.slice(1);
  if (s.length >= 10) return s.length === 10 ? s : '90' + s.slice(-10);
  return s;
}

/** Sadece kullanici olusturur (takimsiz). Oyuna kayit olup sonra takim kodu ile katilim icin. */
export async function createUserOnly(
  name: string,
  phone?: string,
  email?: string,
  position?: 'GK' | 'DEF' | 'MID' | 'FWD',
  shirtNumber?: number
): Promise<Player> {
  const usersRef = collection(db, COLLECTIONS.users);
  const phoneNorm = phone?.trim() ? canonicalPhone(phone.trim()) : null;
  if (phoneNorm) {
    const existing = await getUserByPhoneOrEmail(phoneNorm);
    if (existing) throw new Error('Bu telefon numarası zaten kayıtlı.');
  }
  if (email?.trim()) {
    const existing = await getUserByPhoneOrEmail(undefined, email.trim());
    if (existing) throw new Error('Bu e-posta adresi zaten kayıtlı.');
  }
  const userRef = await addDoc(usersRef, {
    name: name.trim(),
    phone: phoneNorm ?? null,
    email: email?.trim() || null,
    role: 'member',
    position: position ?? 'MID',
    shirtNumber: shirtNumber != null && shirtNumber >= 1 && shirtNumber <= 99 ? shirtNumber : null,
    rating: 7,
    reliability: 100,
    avatar: `https://i.pravatar.cc/150?u=${name.trim().replace(/\s/g, '')}`,
    authzMigrationVersion: 1,
    authzMigrationAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  const user = await getUserById(userRef.id);
  if (!user) throw new Error('User creation failed');
  return user;
}

export interface TeamBasic {
  id: string;
  name: string;
  shortName?: string;
  inviteCode: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export async function getTeamById(teamId: string): Promise<TeamBasic | null> {
  const ref = doc(db, COLLECTIONS.teams, teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() || {};
  return {
    id: snap.id,
    name: (d.name as string) ?? '',
    shortName: d.shortName as string | undefined,
    inviteCode: (d.inviteCode as string) ?? '',
    primaryColor: d.primaryColor as string | undefined,
    secondaryColor: d.secondaryColor as string | undefined,
  };
}

export async function getTeamByInviteCode(inviteCode: string): Promise<TeamBasic | null> {
  const trimmed = inviteCode.trim().toUpperCase();
  if (!trimmed) return null;
  const q = query(
    collection(db, COLLECTIONS.teams),
    where('inviteCode', '==', trimmed),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const d = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: (d.name as string) ?? '',
    shortName: d.shortName as string | undefined,
    inviteCode: (d.inviteCode as string) ?? '',
    primaryColor: d.primaryColor as string | undefined,
    secondaryColor: d.secondaryColor as string | undefined,
  };
}
