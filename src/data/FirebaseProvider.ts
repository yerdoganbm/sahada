/**
 * FirebaseProvider — IDataProvider backed by Firestore + Auth + Storage
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  addDoc, query, where, orderBy, runTransaction,
  onSnapshot, serverTimestamp, Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/client';
import type { IDataProvider, AuthResult, CreateReservationPayload, ProofPayload } from './IDataProvider';
import type {
  Player, Team, Venue, Reservation, MemberContribution,
  CaptainPayoutProfile, LedgerEntry, MatchRSVP,
  OutboxMessage, AuditEvent, TeamJoinRequest,
} from '../../types';

// ── Helpers ────────────────────────────────────────────────────────
function ts(d: any): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Timestamp) return d.toDate().toISOString();
  return String(d);
}
function toPlayer(id: string, d: DocumentData): Player {
  return { id, ...d, createdAt: ts(d.createdAt), joinDate: ts(d.joinDate) } as Player;
}
function toReservation(id: string, d: DocumentData): Reservation {
  return { id, ...d, createdAt: ts(d.createdAt), date: d.date } as Reservation;
}

let _fbUser: User | null = null;
let _currentPlayer: Player | null = null;

async function loadPlayerFromFirestore(uid: string): Promise<Player | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return toPlayer(uid, snap.data());
}

export const FirebaseProvider: IDataProvider = {
  // ── Auth ────────────────────────────────────────────────────────
  async signIn(phone: string, _otp?: string): Promise<AuthResult> {
    // For phone auth we use email+password internally (phone mapped to email)
    const email = `p${phone.replace(/\D/g, '')}@sahada.app`;
    try {
      const cred = await signInWithEmailAndPassword(auth!, email, 'sahada_default_pw');
      _fbUser = cred.user;
      _currentPlayer = await loadPlayerFromFirestore(cred.user.uid);
      return { user: _currentPlayer!, isNew: false };
    } catch {
      // User doesn't exist — create
      const cred = await createUserWithEmailAndPassword(auth!, email, 'sahada_default_pw');
      _fbUser = cred.user;
      const newPlayer: Player = {
        id: cred.user.uid,
        name: 'Yeni Üye',
        phone: phone.replace(/\D/g, ''),
        role: 'member',
        tier: 'free',
        avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
        position: 'MID',
        rating: 0, reliability: 80,
        joinDate: new Date().toISOString(),
        isActive: true,
      } as Player;
      await setDoc(doc(db!, 'users', cred.user.uid), {
        ...newPlayer,
        createdAt: serverTimestamp(),
        joinDate: serverTimestamp(),
      });
      _currentPlayer = newPlayer;
      return { user: newPlayer, isNew: true };
    }
  },

  async signInEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const cred = await signInWithEmailAndPassword(auth!, email, password);
      _fbUser = cred.user;
      _currentPlayer = await loadPlayerFromFirestore(cred.user.uid);
      if (!_currentPlayer) throw new Error('User doc missing');
      return { user: _currentPlayer, isNew: false };
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        const cred = await createUserWithEmailAndPassword(auth!, email, password);
        _fbUser = cred.user;
        await updateProfile(cred.user, { displayName: email.split('@')[0] });
        const newPlayer: Player = {
          id: cred.user.uid,
          name: email.split('@')[0],
          role: 'member',
          tier: 'free',
          avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
          position: 'MID',
          rating: 0, reliability: 80,
          joinDate: new Date().toISOString(),
          isActive: true,
        } as Player;
        await setDoc(doc(db!, 'users', cred.user.uid), {
          ...newPlayer, createdAt: serverTimestamp(),
        });
        _currentPlayer = newPlayer;
        return { user: newPlayer, isNew: true };
      }
      throw e;
    }
  },

  async signUp(phone: string, displayName: string): Promise<AuthResult> {
    const email = `p${phone.replace(/\D/g, '')}@sahada.app`;
    const cred = await createUserWithEmailAndPassword(auth!, email, 'sahada_default_pw');
    _fbUser = cred.user;
    const newPlayer: Player = {
      id: cred.user.uid,
      name: displayName,
      phone: phone.replace(/\D/g, ''),
      role: 'member',
      tier: 'free',
      avatar: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
      position: 'MID',
      rating: 0, reliability: 80,
      joinDate: new Date().toISOString(),
      isActive: true,
    } as Player;
    await setDoc(doc(db!, 'users', cred.user.uid), { ...newPlayer, createdAt: serverTimestamp() });
    _currentPlayer = newPlayer;
    return { user: newPlayer, isNew: true };
  },

  async signOut(): Promise<void> {
    await fbSignOut(auth!);
    _currentPlayer = null;
    _fbUser = null;
  },

  getCurrentUser(): Player | null {
    return _currentPlayer;
  },

  onAuthStateChanged(cb: (u: Player | null) => void) {
    return fbOnAuthStateChanged(auth!, async (user) => {
      if (user) {
        _fbUser = user;
        _currentPlayer = await loadPlayerFromFirestore(user.uid);
        cb(_currentPlayer);
      } else {
        _currentPlayer = null;
        cb(null);
      }
    });
  },

  // ── Read ────────────────────────────────────────────────────────
  async listVenues(): Promise<Venue[]> {
    const snap = await getDocs(collection(db!, 'venues'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Venue);
  },

  async listTeams(userId?: string): Promise<Team[]> {
    let q = collection(db!, 'teams');
    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Team);
    if (!userId) return all;
    return all.filter(t => t.memberUserIds?.includes(userId) || t.captainUserId === userId);
  },

  async listReservations(filter?: { venueId?: string; teamId?: string }): Promise<Reservation[]> {
    let q: any = collection(db!, 'reservations');
    if (filter?.venueId) q = query(q, where('venueId', '==', filter.venueId));
    if (filter?.teamId)  q = query(q, where('teamId',  '==', filter.teamId));
    const snap = await getDocs(q);
    return snap.docs.map(d => toReservation(d.id, d.data()));
  },

  async listContributions(reservationId: string): Promise<MemberContribution[]> {
    const q = query(collection(db!, 'memberContributions'), where('reservationId', '==', reservationId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MemberContribution);
  },

  async listOutbox(filter?: { teamId?: string; reservationId?: string }): Promise<OutboxMessage[]> {
    let q: any = collection(db!, 'outbox');
    if (filter?.teamId) q = query(q, where('teamId', '==', filter.teamId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as OutboxMessage);
  },

  async listAudit(): Promise<AuditEvent[]> {
    const snap = await getDocs(collection(db!, 'audit'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AuditEvent);
  },

  async listPayoutProfiles(): Promise<CaptainPayoutProfile[]> {
    const snap = await getDocs(collection(db!, 'captainPayoutProfiles'));
    return snap.docs.map(d => ({ captainUserId: d.id, ...d.data() }) as CaptainPayoutProfile);
  },

  async listLedger(filter?: { teamId?: string }): Promise<LedgerEntry[]> {
    let q: any = collection(db!, 'ledger');
    if (filter?.teamId) q = query(q, where('teamId', '==', filter.teamId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as LedgerEntry);
  },

  async listMatchRsvps(reservationId: string): Promise<MatchRSVP[]> {
    const q = query(collection(db!, 'matchRsvps'), where('reservationId', '==', reservationId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MatchRSVP);
  },

  async listJoinRequests(teamId: string): Promise<TeamJoinRequest[]> {
    const q = query(collection(db!, 'teamJoinRequests'), where('teamId', '==', teamId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as TeamJoinRequest);
  },

  // ── Write ────────────────────────────────────────────────────────
  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    if (!db) throw new Error('No db');
    // Slot lock via transaction
    const lockId = `${payload.venueId}_${payload.date}_${payload.startTime}`;
    const lockRef = doc(db, 'slotLocks', lockId);
    const resRef = doc(collection(db, 'reservations'));

    const reservation: Omit<Reservation, 'id'> = {
      ...payload, participants: 0,
      status: 'pending', paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    } as any;

    await runTransaction(db, async (tx) => {
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists()) {
        const lock = lockSnap.data();
        if (lock.status === 'confirmed') throw new Error('Slot zaten dolu');
        const holdExpiry = lock.holdExpiresAt?.toDate?.() ?? new Date(lock.holdExpiresAt);
        if (holdExpiry > new Date() && lock.status === 'held') throw new Error('Slot şu an meşgul');
      }
      tx.set(lockRef, { status: 'held', reservationId: resRef.id, holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000) });
      tx.set(resRef, { ...reservation, createdAt: serverTimestamp() });
    });

    return { id: resRef.id, ...reservation };
  },

  async approveReservation(reservationId: string, actorUserId: string): Promise<void> {
    const resRef = doc(db!, 'reservations', reservationId);
    await updateDoc(resRef, { status: 'confirmed', confirmedAt: serverTimestamp() });
    await addDoc(collection(db!, 'audit'), {
      at: serverTimestamp(), actorUserId, action: 'APPROVED',
      entityType: 'reservation', entityId: reservationId,
    });
  },

  async rejectReservation(reservationId: string, reason: string, actorUserId: string): Promise<void> {
    await updateDoc(doc(db!, 'reservations', reservationId), {
      status: 'rejected', cancelReason: reason, cancelledAt: serverTimestamp(),
    });
  },

  async cancelReservation(reservationId: string, reason: string, actorUserId: string): Promise<void> {
    await updateDoc(doc(db!, 'reservations', reservationId), {
      status: 'cancelled', cancelReason: reason, cancelledAt: serverTimestamp(),
    });
  },

  async submitProof(payload: ProofPayload): Promise<{ proofUrl: string }> {
    let proofUrl = '';
    if (typeof payload.proof === 'string') {
      proofUrl = payload.proof;
    } else if (storage) {
      const fileRef = ref(storage, `proofs/${payload.teamId}/${payload.reservationId}/${payload.userId}/${Date.now()}`);
      await uploadBytes(fileRef, payload.proof as File);
      proofUrl = await getDownloadURL(fileRef);
    }

    // Build proof entry for history
    const proofEntry = {
      id: `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: proofUrl,
      type: proofUrl.match(/\.(pdf)$/i) ? 'pdf' : proofUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image' : 'link',
      method: payload.method ?? 'eft',
      amount: payload.amount ?? 0,
      note: payload.note ?? '',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    // Update contribution
    const q = query(
      collection(db!, 'memberContributions'),
      where('reservationId', '==', payload.reservationId),
      where('memberUserId', '==', payload.userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const contribRef = snap.docs[0].ref;
      const contrib = snap.docs[0].data() as MemberContribution;
      const existingHistory = (contrib as any).proofHistory ?? [];
      const newPaid = payload.amount ? Math.min(contrib.expectedAmount, contrib.paidAmount + payload.amount) : contrib.paidAmount;
      const status = newPaid >= contrib.expectedAmount ? 'paid' : newPaid > 0 ? 'partial' : contrib.status;
      await updateDoc(contribRef, {
        proofUrl, proofNote: payload.note ?? '',
        paidAmount: newPaid, status,
        proofHistory: [proofEntry, ...existingHistory],
        lastUpdatedAt: serverTimestamp(),
      });
    }

    // Write outbox
    await addDoc(collection(db!, 'outbox'), {
      teamId: payload.teamId, reservationId: payload.reservationId,
      at: serverTimestamp(), createdByUserId: payload.userId,
      body: `📎 Dekont: ${proofUrl}${payload.note ? ' | ' + payload.note : ''}`,
      status: 'draft',
    });

    return { proofUrl };
  },

  async recordMemberPayment(teamId, reservationId, memberUserId, amount, method, note) {
    const q = query(
      collection(db!, 'memberContributions'),
      where('reservationId', '==', reservationId),
      where('memberUserId', '==', memberUserId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0].data() as MemberContribution;
      const newPaid = Math.min(d.expectedAmount, d.paidAmount + amount);
      const status = newPaid >= d.expectedAmount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
      await updateDoc(snap.docs[0].ref, { paidAmount: newPaid, status, lastUpdatedAt: serverTimestamp() });
    }
    await addDoc(collection(db!, 'ledger'), {
      teamId, reservationId, actorUserId: memberUserId,
      direction: 'member_to_captain', method, amount, note, at: serverTimestamp(),
    });
  },

  async setRSVP(teamId, reservationId, userId, status) {
    const q = query(collection(db!, 'matchRsvps'), where('reservationId', '==', reservationId), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { status, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db!, 'matchRsvps'), { teamId, reservationId, userId, status, updatedAt: serverTimestamp() });
    }
  },

  async createTeam(name, captainUserId): Promise<Team> {
    const ref = await addDoc(collection(db!, 'teams'), {
      name, captainUserId, memberUserIds: [captainUserId], createdAt: serverTimestamp(),
    });
    return { id: ref.id, name, captainUserId, memberUserIds: [captainUserId], createdAt: new Date().toISOString() } as Team;
  },

  async joinTeam(teamId, userId, inviteCode): Promise<'joined' | 'pending'> {
    const teamRef = doc(db!, 'teams', teamId);
    await runTransaction(db!, async (tx) => {
      const snap = await tx.get(teamRef);
      const members: string[] = snap.data()?.memberUserIds ?? [];
      if (!members.includes(userId)) {
        tx.update(teamRef, { memberUserIds: [...members, userId] });
      }
    });
    return 'joined';
  },

  async approveJoinRequest(requestId, captainUserId) {
    await updateDoc(doc(db!, 'teamJoinRequests', requestId), {
      status: 'approved', resolvedAt: serverTimestamp(), resolvedByUserId: captainUserId,
    });
  },

  async rejectJoinRequest(requestId, captainUserId) {
    await updateDoc(doc(db!, 'teamJoinRequests', requestId), {
      status: 'rejected', resolvedAt: serverTimestamp(), resolvedByUserId: captainUserId,
    });
  },

  async updatePayoutProfile(profile: CaptainPayoutProfile): Promise<void> {
    await setDoc(doc(db!, 'captainPayoutProfiles', profile.captainUserId), profile, { merge: true });
  },

  // ── Realtime ────────────────────────────────────────────────────
  subscribeReservations(filter, cb) {
    let q: any = collection(db!, 'reservations');
    if (filter.venueId) q = query(q, where('venueId', '==', filter.venueId));
    if (filter.teamId)  q = query(q, where('teamId',  '==', filter.teamId));
    return onSnapshot(q, snap => cb(snap.docs.map(d => toReservation(d.id, d.data()))));
  },

  subscribeContributions(reservationId, cb) {
    const q = query(collection(db!, 'memberContributions'), where('reservationId', '==', reservationId));
    return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as MemberContribution)));
  },
};
