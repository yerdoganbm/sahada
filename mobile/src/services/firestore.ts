/**
 * Firestore veri katmani – mock/API yerine Firebase Firestore kullanir.
 * Koleksiyonlar: users, teams, matches, venues (Firebase Console'da olusturun).
 */

import firestore from '@react-native-firebase/firestore';
import type { Player, Match, Venue, Payment, Transaction, Poll } from '../types';

const COLLECTIONS = {
  users: 'users',
  teams: 'teams',
  memberships: 'memberships',
  matches: 'matches',
  venues: 'venues',
  notifications: 'notifications',
  payments: 'payments',
  transactions: 'transactions',
  reservations: 'reservations',
  polls: 'polls',
  talent_pool: 'talent_pool',
  scout_reports: 'scout_reports',
  tournament_teams: 'tournament_teams',
  bracket_matches: 'bracket_matches',
  subscription_plans: 'subscription_plans',
  join_requests: 'join_requests',
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
    teamId: d.teamId as string | undefined,
    activeTeamId: d.activeTeamId as string | undefined,
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
    whatsappEnabled: d.whatsappEnabled === true,
    authzMigrationVersion:
      typeof d.authzMigrationVersion === 'number' ? d.authzMigrationVersion : undefined,
  };
}

function docToMatch(doc: DocSnap): Match {
  const d = (doc.data() || {}) as Record<string, unknown>;
  const date = d.matchDate ?? d.date ?? '';
  const time = d.matchTime ?? d.time ?? '';
  const goingCount = typeof d.goingCount === 'number' ? d.goingCount : undefined;
  const waitlistCount = typeof d.waitlistCount === 'number' ? d.waitlistCount : undefined;
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
    goingCount,
    waitlistCount,
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

export interface CreateVenuePayload {
  name: string;
  location: string;
  address?: string;
  pricePerHour: number;
  rating?: number;
  image?: string;
  features?: string[];
  ownerId?: string;
}

export async function createVenue(data: CreateVenuePayload): Promise<Venue> {
  const ref = await firestore().collection(COLLECTIONS.venues).add({
    name: data.name.trim(),
    location: data.location.trim(),
    address: data.address?.trim() ?? data.location.trim(),
    pricePerHour: data.pricePerHour,
    rating: data.rating ?? 0,
    primaryImageUrl: data.image ?? '',
    image: data.image ?? '',
    features: Array.isArray(data.features) ? data.features : [],
    ownerId: data.ownerId ?? null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  const venue = await getVenue(ref.id);
  if (!venue) throw new Error('Venue creation failed');
  return venue;
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
      waitlistEnabled: true,
      goingCount: 0,
      waitlistCount: 0,
      waitlistSeq: 0,
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
    joinPolicy: 'OPEN',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  const teamId = teamRef.id;
  const usersRef = firestore().collection(COLLECTIONS.users);
  const userRef = await usersRef.add({
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
    authzMigrationAt: firestore.FieldValue.serverTimestamp(),
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  // Canonical single owner.
  await teamRef.update({
    ownerId: userRef.id,
    updatedAt: firestore.FieldValue.serverTimestamp(),
    updatedBy: userRef.id,
  });

  // Canonical membership doc (deterministic ID prevents duplicates).
  const membershipId = membershipDocId(teamId, userRef.id);
  await firestore().collection(COLLECTIONS.memberships).doc(membershipId).set({
    teamId,
    userId: userRef.id,
    roleId: 'TEAM_OWNER',
    status: 'ACTIVE',
    version: 1,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    updatedBy: userRef.id,
    previousStatus: null,
    bannedRoleSnapshot: null,
  });

  const user = await getUserById(userRef.id);
  if (!user) throw new Error('User creation failed');
  return { teamId, user };
}

/** Kullanici rolunu gunceller (admin/member). */
export async function updateUserRole(userId: string, role: 'admin' | 'member'): Promise<void> {
  await firestore().collection(COLLECTIONS.users).doc(userId).update({ role });
}

export interface TeamBasic {
  id: string;
  name: string;
  shortName?: string;
  inviteCode: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/** Takımı ID ile getirir. */
export async function getTeamById(teamId: string): Promise<TeamBasic | null> {
  const doc = await firestore().collection(COLLECTIONS.teams).doc(teamId).get();
  if (!doc.exists) return null;
  const d = doc.data() || {};
  return {
    id: doc.id,
    name: (d.name as string) ?? '',
    shortName: d.shortName as string | undefined,
    inviteCode: (d.inviteCode as string) ?? '',
    primaryColor: d.primaryColor as string | undefined,
    secondaryColor: d.secondaryColor as string | undefined,
  };
}

/** Davet kodu ile takım bulur. */
export async function getTeamByInviteCode(inviteCode: string): Promise<TeamBasic | null> {
  const trimmed = inviteCode.trim().toUpperCase();
  if (!trimmed) return null;
  const snap = await firestore()
    .collection(COLLECTIONS.teams)
    .where('inviteCode', '==', trimmed)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const d = doc.data() || {};
  return {
    id: doc.id,
    name: (d.name as string) ?? '',
    shortName: d.shortName as string | undefined,
    inviteCode: (d.inviteCode as string) ?? '',
    primaryColor: d.primaryColor as string | undefined,
    secondaryColor: d.secondaryColor as string | undefined,
  };
}

/** Kullanıcının teamId'sini Firestore'da günceller. */
export async function updateUserTeamId(userId: string, teamId: string): Promise<void> {
  await firestore().collection(COLLECTIONS.users).doc(userId).update({ teamId });
}

/** Kullanıcının aktif takımını günceller (legacy teamId + yeni activeTeamId birlikte). */
export async function setUserActiveTeamId(userId: string, teamId: string): Promise<void> {
  await firestore().collection(COLLECTIONS.users).doc(userId).update({
    teamId,
    activeTeamId: teamId,
    authzMigrationAt: firestore.FieldValue.serverTimestamp(),
  });
}

/** Kullanıcı profil alanlarını Firestore'da günceller. */
export async function updateUserInFirestore(
  userId: string,
  updates: Partial<Pick<Player, 'name' | 'position' | 'email' | 'phone' | 'avatar' | 'shirtNumber' | 'whatsappEnabled'>>
): Promise<void> {
  const filtered: Record<string, unknown> = {};
  const allowed = ['name', 'position', 'email', 'phone', 'avatar', 'shirtNumber', 'whatsappEnabled'];
  for (const k of allowed) {
    if (k in updates && (updates as Record<string, unknown>)[k] !== undefined) {
      filtered[k] = (updates as Record<string, unknown>)[k];
    }
  }
  if (Object.keys(filtered).length === 0) return;
  await firestore().collection(COLLECTIONS.users).doc(userId).update(filtered);
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

/** Abonelik planlarını getirir. */
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price?: number;
  features?: string[];
  description?: string;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const snap = await firestore().collection(COLLECTIONS.subscription_plans).orderBy('price').get();
    return snap.docs.map((doc) => {
      const d = (doc.data() || {}) as Record<string, unknown>;
      return {
        id: doc.id,
        name: (d.name as string) ?? '',
        tier: (d.tier as string) ?? 'free',
        price: d.price as number | undefined,
        features: (d.features as string[]) ?? [],
        description: d.description as string | undefined,
      };
    });
  } catch {
    return [];
  }
}

/** Kullanicinin teamId'sini dondurur. */
export async function getTeamIdForUser(userId: string): Promise<string | null> {
  const userDoc = await firestore().collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) return null;
  return (userDoc.data()?.teamId as string) ?? null;
}

// ─────────────────────────────────────────────
// Memberships (new canonical model; legacy-compatible)
// ─────────────────────────────────────────────

export type MembershipStatusV1 =
  | 'INVITED'
  | 'INVITE_EXPIRED'
  | 'REQUESTED'
  | 'REQUEST_REJECTED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BANNED'
  | 'TEMP_BANNED'
  | 'LEFT'
  | 'TRANSFERRED';

export interface MembershipItem {
  id: string;
  teamId: string;
  userId: string;
  roleId: string;
  status: MembershipStatusV1;
  version: number;
  bannedRoleSnapshot?: string;
  leftAt?: unknown;
  rejectedAt?: unknown;
  banEnd?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
  previousStatus?: MembershipStatusV1;
}

function membershipDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`;
}

function mapLegacyUserToTeamRoleId(user: Player): string {
  // Legacy: role='admin' implies team admin (owner will be introduced later).
  if (user.role === 'admin') return 'TEAM_ADMIN';
  if (user.isCaptain === true) return 'CAPTAIN';
  if (user.role === 'guest') return 'GUEST';
  return 'MEMBER';
}

function docToMembership(doc: DocSnap): MembershipItem {
  const d = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    teamId: (d.teamId as string) ?? '',
    userId: (d.userId as string) ?? '',
    roleId: (d.roleId as string) ?? 'MEMBER',
    status: ((d.status as string) ?? 'ACTIVE') as MembershipStatusV1,
    version: typeof d.version === 'number' ? d.version : 0,
    bannedRoleSnapshot: d.bannedRoleSnapshot as string | undefined,
    leftAt: d.leftAt,
    rejectedAt: d.rejectedAt,
    banEnd: d.banEnd,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    updatedBy: d.updatedBy as string | undefined,
    previousStatus: d.previousStatus as MembershipStatusV1 | undefined,
  };
}

export async function getMembership(teamId: string, userId: string): Promise<MembershipItem | null> {
  const id = membershipDocId(teamId, userId);
  const doc = await firestore().collection(COLLECTIONS.memberships).doc(id).get();
  if (!doc.exists) return null;
  return docToMembership(doc);
}

export async function getActiveMembershipsForUser(userId: string): Promise<MembershipItem[]> {
  const snap = await firestore()
    .collection(COLLECTIONS.memberships)
    .where('userId', '==', userId)
    .where('status', '==', 'ACTIVE')
    .limit(50)
    .get();
  return snap.docs.map(docToMembership);
}

export async function ensureLegacyMembership(user: Player): Promise<MembershipItem | null> {
  const teamId = user.teamId;
  if (!teamId) return null;

  const id = membershipDocId(teamId, user.id);
  const ref = firestore().collection(COLLECTIONS.memberships).doc(id);
  const existing = await ref.get();
  if (existing.exists) return docToMembership(existing);

  const roleId = mapLegacyUserToTeamRoleId(user);
  await ref.set({
    teamId,
    userId: user.id,
    roleId,
    status: 'ACTIVE',
    version: 1,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    updatedBy: user.id,
    previousStatus: null,
    bannedRoleSnapshot: null,
  });

  const created = await ref.get();
  return created.exists ? docToMembership(created) : null;
}

export async function updateUserAuthzFields(
  userId: string,
  updates: { activeTeamId?: string | null; authzMigrationVersion?: number }
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if ('activeTeamId' in updates) payload.activeTeamId = updates.activeTeamId ?? null;
  if ('authzMigrationVersion' in updates) payload.authzMigrationVersion = updates.authzMigrationVersion ?? 1;
  payload.authzMigrationAt = firestore.FieldValue.serverTimestamp();
  await firestore().collection(COLLECTIONS.users).doc(userId).update(payload);
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

/** Ödemeleri getirir (teamId, playerId veya status ile filtre). */
export async function getPayments(params?: {
  teamId?: string;
  playerId?: string;
  status?: 'PAID' | 'PENDING' | 'REFUND';
}): Promise<Payment[]> {
  let q = firestore().collection(COLLECTIONS.payments).limit(100);
  if (params?.teamId) q = q.where('teamId', '==', params.teamId) as any;
  if (params?.playerId) q = q.where('playerId', '==', params.playerId) as any;
  if (params?.status) q = q.where('status', '==', params.status) as any;
  const snap = await q.get();
  const list = snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      playerId: (d.playerId as string) ?? '',
      playerName: (d.playerName as string) ?? '',
      amount: typeof d.amount === 'number' ? d.amount : 0,
      dueDate: (d.dueDate as string) ?? '',
      status: ((d.status as string) ?? 'PENDING') as Payment['status'],
      month: (d.month as string) ?? '',
      proofUrl: d.proofUrl as string | undefined,
      teamId: d.teamId as string | undefined,
    };
  });
  return list.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
}

/** Finansal işlemleri getirir (gelir/gider). */
export async function getTransactions(params?: {
  teamId?: string;
  type?: 'income' | 'expense';
}): Promise<Transaction[]> {
  let q = firestore().collection(COLLECTIONS.transactions).limit(100);
  if (params?.teamId) q = q.where('teamId', '==', params.teamId) as any;
  if (params?.type) q = q.where('type', '==', params.type) as any;
  const snap = await q.get();
  const list = snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      type: ((d.type as string) ?? 'income') as Transaction['type'],
      category: ((d.category as string) ?? 'gelir') as Transaction['category'],
      amount: typeof d.amount === 'number' ? d.amount : 0,
      date: (d.date as string) ?? '',
      description: (d.description as string) ?? (d.title as string) ?? '',
      teamId: d.teamId as string | undefined,
    };
  });
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export interface Reservation {
  id: string;
  venueId: string;
  venueName: string;
  teamName?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  participants?: number;
}

/** Rezervasyonu ID ile getirir. */
export async function getReservationById(id: string): Promise<Reservation | null> {
  const doc = await firestore().collection(COLLECTIONS.reservations).doc(id).get();
  if (!doc.exists) return null;
  const d = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    venueId: (d.venueId as string) ?? '',
    venueName: (d.venueName as string) ?? '',
    teamName: d.teamName as string | undefined,
    date: (d.date as string) ?? '',
    startTime: (d.startTime as string) ?? '',
    endTime: (d.endTime as string) ?? '',
    duration: d.duration as number | undefined,
    price: typeof d.price === 'number' ? d.price : 0,
    status: ((d.status as string) ?? 'pending') as Reservation['status'],
    participants: d.participants as number | undefined,
  };
}

/** Rezervasyon durumunu günceller (onay/iptal). */
export async function updateReservationStatus(
  id: string,
  status: 'confirmed' | 'cancelled'
): Promise<void> {
  await firestore().collection(COLLECTIONS.reservations).doc(id).update({ status });
}

/** Rezervasyonları getirir (venueId ile filtre). */
export async function getReservations(params?: { venueId?: string }): Promise<Reservation[]> {
  let q = firestore().collection(COLLECTIONS.reservations).limit(100);
  if (params?.venueId) q = q.where('venueId', '==', params.venueId) as any;
  const snap = await q.get();
  const list = snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      venueId: (d.venueId as string) ?? '',
      venueName: (d.venueName as string) ?? '',
      teamName: d.teamName as string | undefined,
      date: (d.date as string) ?? '',
      startTime: (d.startTime as string) ?? '',
      endTime: (d.endTime as string) ?? '',
      duration: d.duration as number | undefined,
      price: typeof d.price === 'number' ? d.price : 0,
      status: ((d.status as string) ?? 'pending') as Reservation['status'],
      participants: d.participants as number | undefined,
    };
  });
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/** Rezervasyon oluşturur. */
export async function createReservation(data: {
  venueId: string;
  venueName?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  price?: number;
  teamName?: string;
  contactPerson?: string;
  contactPhone?: string;
}): Promise<Reservation> {
  const ref = await firestore().collection(COLLECTIONS.reservations).add({
    venueId: data.venueId,
    venueName: data.venueName ?? '',
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: data.duration ?? 60,
    price: data.price ?? 0,
    status: 'pending',
    teamName: data.teamName ?? null,
    contactPerson: data.contactPerson ?? null,
    contactPhone: data.contactPhone ?? null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return {
    id: ref.id,
    venueId: data.venueId,
    venueName: data.venueName ?? '',
    teamName: data.teamName,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: data.duration,
    price: data.price ?? 0,
    status: 'pending',
  };
}

/** Anketleri getirir. */
export async function getPolls(teamId?: string): Promise<Poll[]> {
  let q = firestore().collection(COLLECTIONS.polls).limit(50);
  if (teamId) q = q.where('teamId', '==', teamId) as any;
  const snap = await q.get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    const options = (Array.isArray(d.options) ? d.options : []) as Array<{ id: string; text: string; votes: number }>;
    const voters = (Array.isArray(d.voters) ? d.voters : []) as string[];
    return {
      id: doc.id,
      question: (d.question as string) ?? '',
      options,
      totalVotes: typeof d.totalVotes === 'number' ? d.totalVotes : options.reduce((s, o) => s + (o.votes || 0), 0),
      isVoted: false,
      expiresAt: (d.expiresAt as string) ?? (d.endDate as string) ?? '',
      teamId: d.teamId as string | undefined,
      voters,
    };
  });
}

/** Ankete oy verir. */
export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  const ref = firestore().collection(COLLECTIONS.polls).doc(pollId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Poll not found');
  const d = doc.data() || {};
  const options = [...(Array.isArray(d.options) ? d.options : [])] as Array<{ id: string; text: string; votes: number }>;
  const voters = (Array.isArray(d.voters) ? d.voters : []) as string[];
  if (voters.includes(userId)) throw new Error('Zaten oy kullandınız');
  const opt = options.find((o) => o.id === optionId);
  if (!opt) throw new Error('Invalid option');
  opt.votes = (opt.votes || 0) + 1;
  voters.push(userId);
  const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0);
  await ref.update({ options, voters, totalVotes });
}

/** Bildirimi okundu işaretler. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await firestore().collection(COLLECTIONS.notifications).doc(notificationId).update({
    isRead: true,
    read: true,
  });
}

/** Talent pool listesi. */
export interface TalentPoolItem {
  id: string;
  teamId?: string;
  name: string;
  position: string;
  contactNumber?: string;
  status?: string;
  averageScore?: number;
  potentialRating?: number;
  source?: string;
}

export async function getTalentPool(teamId?: string): Promise<TalentPoolItem[]> {
  let q = firestore().collection(COLLECTIONS.talent_pool).limit(50);
  if (teamId) q = q.where('teamId', '==', teamId) as any;
  const snap = await q.get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      teamId: d.teamId as string | undefined,
      name: (d.name as string) ?? '',
      position: (d.position as string) ?? 'MID',
      contactNumber: d.contactNumber as string | undefined,
      status: d.status as string | undefined,
      averageScore: d.averageScore as number | undefined,
      potentialRating: d.potentialRating as number | undefined,
      source: d.source as string | undefined,
    };
  });
}

/** Scout raporları. */
export interface ScoutReportItem {
  id: string;
  playerId?: string;
  scoutName?: string;
  date?: string;
  overallScore?: number;
  potential?: number;
  recommendation?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export async function getScoutReports(): Promise<ScoutReportItem[]> {
  const snap = await firestore().collection(COLLECTIONS.scout_reports).limit(50).get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      playerId: d.playerId as string | undefined,
      scoutName: (d.scoutName as string) ?? '',
      date: d.date as string | undefined,
      overallScore: d.overallScore as number | undefined,
      potential: d.potential as number | undefined,
      recommendation: d.recommendation as string | undefined,
      strengths: (d.strengths as string[]) ?? [],
      weaknesses: (d.weaknesses as string[]) ?? [],
    };
  });
}

/** Turnuva takımları. */
export interface TournamentTeam {
  id: string;
  name: string;
  logo?: string;
  stats?: { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
}

export async function getTournamentTeams(): Promise<TournamentTeam[]> {
  const snap = await firestore().collection(COLLECTIONS.tournament_teams).limit(20).get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      name: (d.name as string) ?? '',
      logo: d.logo as string | undefined,
      stats: d.stats as TournamentTeam['stats'],
    };
  });
}

/** Turnuva fikstür maçları. */
export interface BracketMatch {
  id: string;
  round: string;
  team1?: { id: string; name: string };
  team2?: { id: string; name: string };
  winnerId?: string;
  date?: string;
  score?: string;
  status?: string;
}

export async function getBracketMatches(): Promise<BracketMatch[]> {
  const snap = await firestore().collection(COLLECTIONS.bracket_matches).limit(20).get();
  return snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      round: (d.round as string) ?? '',
      team1: d.team1 as BracketMatch['team1'],
      team2: d.team2 as BracketMatch['team2'],
      winnerId: d.winnerId as string | undefined,
      date: d.date as string | undefined,
      score: d.score as string | undefined,
      status: d.status as string | undefined,
    };
  });
}

/** Ödeme dekont URL'ini günceller. */
export async function updatePaymentProof(paymentId: string, proofUrl: string): Promise<void> {
  await firestore().collection(COLLECTIONS.payments).doc(paymentId).update({
    proofUrl,
    proofUpdatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

/** Ödeme ekler. */
export async function addPayment(data: {
  playerId: string;
  playerName?: string;
  teamId?: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'REFUND';
  month?: string;
}): Promise<Payment> {
  const ref = await firestore().collection(COLLECTIONS.payments).add({
    playerId: data.playerId,
    playerName: data.playerName ?? '',
    teamId: data.teamId ?? null,
    amount: data.amount,
    status: data.status,
    month: data.month ?? new Date().toISOString().slice(0, 7),
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return {
    id: ref.id,
    playerId: data.playerId,
    playerName: data.playerName ?? '',
    amount: data.amount,
    dueDate: '',
    status: data.status,
    month: data.month ?? '',
    teamId: data.teamId,
  };
}

/** İşlem (gelir/gider) ekler. */
export async function addTransaction(data: {
  teamId?: string;
  type: 'income' | 'expense';
  category?: string;
  amount: number;
  date: string;
  description?: string;
}): Promise<Transaction> {
  const amt = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
  const ref = await firestore().collection(COLLECTIONS.transactions).add({
    teamId: data.teamId ?? null,
    type: data.type,
    category: data.category ?? (data.type === 'income' ? 'gelir' : 'diger'),
    amount: amt,
    date: data.date,
    description: data.description ?? '',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return {
    id: ref.id,
    type: data.type,
    category: (data.category as Transaction['category']) ?? 'gelir',
    amount: amt,
    date: data.date,
    description: data.description ?? '',
    teamId: data.teamId,
  };
}

export interface JoinRequestItem {
  id: string;
  teamId: string;
  name: string;
  phone: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: unknown;
}

/** Takımın katılım isteklerini getirir. */
export async function getJoinRequests(teamId: string): Promise<JoinRequestItem[]> {
  const snap = await firestore()
    .collection(COLLECTIONS.join_requests)
    .where('teamId', '==', teamId)
    .limit(50)
    .get();
  const list = snap.docs.map((doc) => {
    const d = (doc.data() || {}) as Record<string, unknown>;
    return {
      id: doc.id,
      teamId: (d.teamId as string) ?? '',
      name: (d.name as string) ?? '',
      phone: (d.phone as string) ?? '',
      position: (d.position as JoinRequestItem['position']) ?? 'MID',
      avatar: (d.avatar as string) || `https://i.pravatar.cc/150?u=${doc.id}`,
      status: ((d.status as string) ?? 'pending') as JoinRequestItem['status'],
      createdAt: d.createdAt,
    };
  });
  return list.filter((r) => r.status === 'pending');
}

/** Katılım isteğini onaylar – users'a ekler ve status günceller. */
export async function approveJoinRequest(requestId: string): Promise<void> {
  const ref = firestore().collection(COLLECTIONS.join_requests).doc(requestId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Katılım isteği bulunamadı');
  const d = doc.data() || {};
  const teamId = d.teamId as string;
  const name = (d.name as string) ?? '';
  const phone = (d.phone as string) ?? '';
  const position = (d.position as string) ?? 'MID';
  const avatar = (d.avatar as string) || `https://i.pravatar.cc/150?u=${requestId}`;

  await firestore().collection(COLLECTIONS.users).add({
    teamId,
    name,
    phone: phone || null,
    position,
    role: 'member',
    rating: 6,
    reliability: 100,
    avatar,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  await ref.update({ status: 'approved' });
}

/** Katılım isteğini reddeder. */
export async function rejectJoinRequest(requestId: string): Promise<void> {
  await firestore().collection(COLLECTIONS.join_requests).doc(requestId).update({ status: 'rejected' });
}

/** Yeni katılım isteği oluşturur (oyuncu önerisi). */
export async function createJoinRequest(data: {
  teamId: string;
  name: string;
  phone: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  referrerId?: string;
}): Promise<JoinRequestItem> {
  const ref = await firestore().collection(COLLECTIONS.join_requests).add({
    teamId: data.teamId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    position: data.position,
    status: 'pending',
    referrerId: data.referrerId ?? null,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  const doc = await ref.get();
  const d = (doc.data() || {}) as Record<string, unknown>;
  return {
    id: ref.id,
    teamId: (d.teamId as string) ?? '',
    name: (d.name as string) ?? '',
    phone: (d.phone as string) ?? '',
    position: (d.position as JoinRequestItem['position']) ?? 'MID',
    avatar: (d.avatar as string) || `https://i.pravatar.cc/150?u=${ref.id}`,
    status: 'pending',
    createdAt: d.createdAt,
  };
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
