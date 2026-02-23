import firestore from '@react-native-firebase/firestore';

export type ParticipationState = 'GOING' | 'WAITLIST' | 'NOT_GOING' | 'MAYBE';

export interface ParticipationDoc {
  userId: string;
  state: ParticipationState;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export async function getMyParticipationState(matchId: string, userId: string): Promise<ParticipationState | null> {
  const snap = await firestore()
    .collection('matches')
    .doc(matchId)
    .collection('participants')
    .doc(userId)
    .get();
  if (!snap.exists) return null;
  const d = (snap.data() || {}) as Record<string, unknown>;
  const st = d.state;
  if (st === 'GOING' || st === 'WAITLIST' || st === 'NOT_GOING' || st === 'MAYBE') return st;
  return null;
}

export async function listParticipants(matchId: string, limit = 100): Promise<ParticipationDoc[]> {
  const snap = await firestore()
    .collection('matches')
    .doc(matchId)
    .collection('participants')
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const data = (d.data() || {}) as Record<string, unknown>;
    const state = data.state as ParticipationState;
    return {
      userId: (data.userId as string) ?? d.id,
      state,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export async function rsvp(args: {
  matchId: string;
  userId: string;
  desiredState: ParticipationState;
}): Promise<{ didAutoPromote: boolean }> {
  const { matchId, userId, desiredState } = args;

  if (!matchId || !userId) throw new Error('invalid_args');
  if (!['GOING', 'WAITLIST', 'NOT_GOING', 'MAYBE'].includes(desiredState)) throw new Error('invalid_state');

  const matchRef = firestore().collection('matches').doc(matchId);
  const participantRef = matchRef.collection('participants').doc(userId);
  const waitlistRef = matchRef.collection('waitlist').doc(userId);
  const auditRef = firestore().collection('audits').doc();

  let shouldAutoPromote = false;

  await firestore().runTransaction(async (tx) => {
    const [matchSnap, participantSnap, waitlistSnap] = await Promise.all([
      tx.get(matchRef),
      tx.get(participantRef),
      tx.get(waitlistRef),
    ]);
    if (!matchSnap.exists) throw new Error('match_not_found');

    const match = (matchSnap.data() || {}) as Record<string, unknown>;
    const capacity = toNumber(match.capacity, 14);
    const waitlistEnabled = match.waitlistEnabled !== false;
    const goingCount = toNumber(match.goingCount, 0);
    const waitlistCount = toNumber(match.waitlistCount, 0);
    const waitlistSeq = toNumber(match.waitlistSeq, 0);

    const p = (participantSnap.data() || {}) as Record<string, unknown>;
    const prevState = (p.state as ParticipationState | undefined) ?? 'NOT_GOING';

    const isPrevGoing = prevState === 'GOING';
    const isPrevWaitlist = prevState === 'WAITLIST';

    const setParticipant = (state: ParticipationState) => {
      if (!participantSnap.exists) {
        tx.set(participantRef, {
          userId,
          state,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        tx.update(participantRef, { state, updatedAt: firestore.FieldValue.serverTimestamp() } as any);
      }
    };

    // Normalize desired WAITLIST: only allowed via capacity full + waitlistEnabled.
    if (desiredState === 'WAITLIST') {
      if (!waitlistEnabled) throw new Error('waitlist_disabled');
    }

    if (desiredState === 'GOING') {
      if (isPrevGoing) {
        // idempotent
      } else if (goingCount < capacity) {
        setParticipant('GOING');
        tx.update(matchRef, {
          goingCount: goingCount + 1,
          ...(isPrevWaitlist && waitlistSnap.exists ? { waitlistCount: Math.max(0, waitlistCount - 1) } : {}),
        } as any);
        if (waitlistSnap.exists) tx.delete(waitlistRef);
      } else {
        // Full → waitlist (if enabled), else still store as NOT_GOING.
        if (waitlistEnabled) {
          setParticipant('WAITLIST');
          if (!waitlistSnap.exists) {
            const nextSeq = waitlistSeq + 1;
            tx.set(waitlistRef, {
              userId,
              queue: nextSeq,
              createdAt: firestore.FieldValue.serverTimestamp(),
            });
            tx.update(matchRef, { waitlistCount: waitlistCount + 1, waitlistSeq: nextSeq } as any);
          }
        } else {
          setParticipant('NOT_GOING');
        }
      }
    } else if (desiredState === 'NOT_GOING') {
      setParticipant('NOT_GOING');
      if (isPrevGoing) {
        tx.update(matchRef, { goingCount: Math.max(0, goingCount - 1) } as any);
        shouldAutoPromote = waitlistEnabled;
      }
      if (isPrevWaitlist && waitlistSnap.exists) {
        tx.delete(waitlistRef);
        tx.update(matchRef, { waitlistCount: Math.max(0, waitlistCount - 1) } as any);
      }
    } else if (desiredState === 'MAYBE') {
      setParticipant('MAYBE');
      if (isPrevGoing) {
        tx.update(matchRef, { goingCount: Math.max(0, goingCount - 1) } as any);
        shouldAutoPromote = waitlistEnabled;
      }
      if (isPrevWaitlist && waitlistSnap.exists) {
        tx.delete(waitlistRef);
        tx.update(matchRef, { waitlistCount: Math.max(0, waitlistCount - 1) } as any);
      }
    }

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: userId,
      action: 'RSVP',
      scope: 'TEAM',
      scopeId: (match.teamId as string) ?? 'unknown',
      target: { type: 'match', id: matchId },
      meta: { desiredState, prevState },
    });
  });

  let didAutoPromote = false;
  if (shouldAutoPromote) {
    didAutoPromote = await autoPromoteWaitlist(matchId);
  }
  return { didAutoPromote };
}

export async function autoPromoteWaitlist(matchId: string): Promise<boolean> {
  const matchRef = firestore().collection('matches').doc(matchId);
  const waitlistCol = matchRef.collection('waitlist');

  // Query outside the transaction; promotion is guarded by a second transaction.
  const snap = await waitlistCol
    .orderBy('queue', 'asc')
    .orderBy(firestore.FieldPath.documentId(), 'asc')
    .limit(1)
    .get();
  if (snap.empty) return false;
  const entryDoc = snap.docs[0];
  const nextUserId = entryDoc.id;

  const participantRef = matchRef.collection('participants').doc(nextUserId);
  const waitlistRef = matchRef.collection('waitlist').doc(nextUserId);
  const auditRef = firestore().collection('audits').doc();

  return firestore().runTransaction(async (tx) => {
    const [matchSnap, waitSnap, partSnap] = await Promise.all([
      tx.get(matchRef),
      tx.get(waitlistRef),
      tx.get(participantRef),
    ]);
    if (!matchSnap.exists) return false;
    if (!waitSnap.exists) return false;

    const match = (matchSnap.data() || {}) as Record<string, unknown>;
    const capacity = toNumber(match.capacity, 14);
    const goingCount = toNumber(match.goingCount, 0);
    const waitlistCount = toNumber(match.waitlistCount, 0);
    const waitlistEnabled = match.waitlistEnabled !== false;
    if (!waitlistEnabled) return false;
    if (goingCount >= capacity) return false;

    const p = (partSnap.data() || {}) as Record<string, unknown>;
    const prevState = (p.state as ParticipationState | undefined) ?? 'NOT_GOING';
    if (prevState === 'GOING') {
      // Already promoted by another transaction.
      tx.delete(waitlistRef);
      tx.update(matchRef, { waitlistCount: Math.max(0, waitlistCount - 1) } as any);
      return true;
    }

    if (!partSnap.exists) {
      tx.set(participantRef, { userId: nextUserId, state: 'GOING', createdAt: firestore.FieldValue.serverTimestamp(), updatedAt: firestore.FieldValue.serverTimestamp() });
    } else {
      tx.update(participantRef, { state: 'GOING', updatedAt: firestore.FieldValue.serverTimestamp() } as any);
    }
    tx.delete(waitlistRef);
    tx.update(matchRef, {
      goingCount: goingCount + 1,
      waitlistCount: Math.max(0, waitlistCount - 1),
    } as any);

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: 'system',
      action: 'WAITLIST_AUTOPROMOTE',
      scope: 'TEAM',
      scopeId: (match.teamId as string) ?? 'unknown',
      target: { type: 'match', id: matchId },
      meta: { promotedUserId: nextUserId, from: prevState },
    });

    return true;
  });
}

