import admin from 'firebase-admin';
import crypto from 'crypto';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}. Start Firestore emulator and set ${name}.`);
  return v;
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

async function main() {
  // Firestore emulator must be running.
  requireEnv('FIRESTORE_EMULATOR_HOST');

  const projectId = process.env.GCLOUD_PROJECT || 'demo-sahada';
  admin.initializeApp({ projectId });
  const db = admin.firestore();

  // ─────────────────────────────────────────────
  // 1) RSVP concurrency (capacity=1)
  // ─────────────────────────────────────────────
  const matchId = `m_${Date.now()}`;
  const matchRef = db.collection('matches').doc(matchId);
  await matchRef.set({
    teamId: 't1',
    capacity: 1,
    waitlistEnabled: true,
    goingCount: 0,
    waitlistCount: 0,
    waitlistSeq: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  async function rsvpGoing(userId) {
    const participantRef = matchRef.collection('participants').doc(userId);
    const waitlistRef = matchRef.collection('waitlist').doc(userId);
    await db.runTransaction(async (tx) => {
      const [mSnap, pSnap, wSnap] = await Promise.all([
        tx.get(matchRef),
        tx.get(participantRef),
        tx.get(waitlistRef),
      ]);
      const m = mSnap.data() || {};
      const capacity = typeof m.capacity === 'number' ? m.capacity : 14;
      const goingCount = typeof m.goingCount === 'number' ? m.goingCount : 0;
      const waitlistCount = typeof m.waitlistCount === 'number' ? m.waitlistCount : 0;
      const waitlistSeq = typeof m.waitlistSeq === 'number' ? m.waitlistSeq : 0;

      const prev = pSnap.exists ? (pSnap.data()?.state ?? 'NOT_GOING') : 'NOT_GOING';
      if (prev === 'GOING') return;

      if (goingCount < capacity) {
        tx.set(participantRef, { userId, state: 'GOING', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        tx.update(matchRef, { goingCount: goingCount + 1 });
        if (wSnap.exists) {
          tx.delete(waitlistRef);
          tx.update(matchRef, { waitlistCount: Math.max(0, waitlistCount - 1) });
        }
      } else {
        tx.set(participantRef, { userId, state: 'WAITLIST', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        if (!wSnap.exists) {
          const nextSeq = waitlistSeq + 1;
          tx.set(waitlistRef, { userId, queue: nextSeq, createdAt: admin.firestore.FieldValue.serverTimestamp() });
          tx.update(matchRef, { waitlistCount: waitlistCount + 1, waitlistSeq: nextSeq });
        }
      }
    });
  }

  const users = Array.from({ length: 10 }).map((_, i) => `u${i + 1}`);
  await Promise.all(users.map((u) => rsvpGoing(u)));

  const matchAfter = (await matchRef.get()).data() || {};
  assert(matchAfter.goingCount === 1, `goingCount should be 1, got ${matchAfter.goingCount}`);
  assert(matchAfter.waitlistCount === 9, `waitlistCount should be 9, got ${matchAfter.waitlistCount}`);

  const goingSnap = await matchRef.collection('participants').where('state', '==', 'GOING').get();
  assert(goingSnap.size === 1, `participants GOING should be 1, got ${goingSnap.size}`);

  const waitSnap = await matchRef.collection('waitlist').get();
  assert(waitSnap.size === 9, `waitlist docs should be 9, got ${waitSnap.size}`);
  const queues = waitSnap.docs.map((d) => d.data()?.queue).filter((x) => typeof x === 'number');
  assert(queues.length === 9, 'all waitlist entries should have numeric queue');
  assert(new Set(queues).size === 9, 'waitlist queue values should be unique');

  // ─────────────────────────────────────────────
  // 2) Payment idempotency concurrency
  // ─────────────────────────────────────────────
  const idKey = sha256Hex(`match:${matchId}:user:u1:amount:100:bucket:${new Date().toISOString().slice(0, 10)}`);
  const idRef = db.collection('payment_idempotency').doc(idKey);

  async function markPaymentOnce() {
    const paymentRef = db.collection('payments').doc();
    await db.runTransaction(async (tx) => {
      const idSnap = await tx.get(idRef);
      if (idSnap.exists) return;
      tx.set(idRef, { createdAt: admin.firestore.FieldValue.serverTimestamp(), paymentId: paymentRef.id });
      tx.set(paymentRef, {
        teamId: 't1',
        playerId: 'u1',
        amount: 100,
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  await Promise.all(Array.from({ length: 5 }).map(() => markPaymentOnce()));
  const idDoc = await idRef.get();
  assert(idDoc.exists, 'idempotency doc should exist');
  const paymentId = idDoc.data()?.paymentId;
  assert(typeof paymentId === 'string' && paymentId.length > 0, 'idempotency paymentId should be set');
  const paymentsForUser = await db.collection('payments').where('playerId', '==', 'u1').where('teamId', '==', 't1').get();
  assert(paymentsForUser.size === 1, `payments should be 1 (idempotent), got ${paymentsForUser.size}`);

  // ─────────────────────────────────────────────
  // 3) Invite accept race (single-use)
  // ─────────────────────────────────────────────
  const token = `tok_${Date.now()}`;
  const tokenHash = sha256Hex(token);
  const inviteRef = db.collection('invites').doc();
  await inviteRef.set({
    teamId: 't1',
    inviterId: 'admin',
    target: { type: 'PHONE', value: '5551234567' },
    roleId: 'MEMBER',
    tokenHash,
    status: 'INVITED',
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60_000)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  async function acceptInviteAs(userId) {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(inviteRef);
      const inv = snap.data() || {};
      if (inv.status === 'ACCEPTED') {
        const acceptedBy = inv.acceptedBy;
        if (acceptedBy && acceptedBy !== userId) throw new Error('invite_already_used');
        return;
      }
      if (inv.status !== 'INVITED') throw new Error('invite_not_active');
      tx.update(inviteRef, {
        status: 'ACCEPTED',
        acceptedBy: userId,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  const [a, b] = await Promise.allSettled([acceptInviteAs('u1'), acceptInviteAs('u2')]);
  assert(
    (a.status === 'fulfilled' && b.status === 'rejected') || (a.status === 'rejected' && b.status === 'fulfilled'),
    `expected exactly one accept success, got a=${a.status}, b=${b.status}`
  );

  console.log('OK: concurrency invariants passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

