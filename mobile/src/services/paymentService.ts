import firestore from '@react-native-firebase/firestore';
import { BuiltInPermissionId } from '../domain/roleRegistry';
import { assertAllowed, authorizeTeamAction } from './authz';
import { sha256Hex } from '../utils/token';

function dateBucketUTC(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function paymentIdempotencyKey(args: {
  matchId: string;
  userId: string;
  amount: number;
  dateBucket: string;
}): string {
  const base = `${args.matchId}:${args.userId}:${args.amount}:${args.dateBucket}`;
  return sha256Hex(base);
}

/**
 * Mark a payment with an idempotency key (transactional).
 *
 * In production: must be called from Cloud Functions.
 */
export async function markPayment(args: {
  teamId: string;
  matchId: string;
  userId: string;
  userName?: string;
  amount: number;
  proofUrl?: string;
  actorId: string;
  now?: Date;
}): Promise<{ paymentId: string; idempotencyKey: string }> {
  const { teamId, matchId, userId, userName, amount, proofUrl, actorId } = args;
  const now = args.now ?? new Date();
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('invalid_amount');

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.PAYMENT_MARK,
    resourceType: 'payment',
    resourceId: matchId,
  });
  assertAllowed(decision);

  const dateBucket = dateBucketUTC(now);
  const idempotencyKey = paymentIdempotencyKey({ matchId, userId, amount, dateBucket });

  const idemRef = firestore().collection('payment_idempotency').doc(idempotencyKey);
  const paymentRef = firestore().collection('payments').doc(); // auto ID
  const auditRef = firestore().collection('audits').doc();

  let paymentId: string | null = null;

  await firestore().runTransaction(async (tx) => {
    const idemSnap = await tx.get(idemRef);
    if (idemSnap.exists) {
      const d = (idemSnap.data() || {}) as Record<string, unknown>;
      const existingPaymentId = d.paymentId as string | undefined;
      if (existingPaymentId) {
        paymentId = existingPaymentId;
        return;
      }
    }

    tx.set(paymentRef, {
      teamId,
      matchId,
      playerId: userId,
      playerName: userName ?? '',
      amount,
      status: 'PENDING',
      month: dateBucket.slice(0, 7),
      proofUrl: proofUrl ?? null,
      idempotencyKey,
      markedBy: actorId,
      markedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    tx.set(idemRef, {
      teamId,
      matchId,
      userId,
      amount,
      dateBucket,
      paymentId: paymentRef.id,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: actorId,
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'PAYMENT_MARK',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'payment', id: paymentRef.id },
      meta: { matchId, userId, amount, idempotencyKeyPrefix: idempotencyKey.slice(0, 8) },
    });

    paymentId = paymentRef.id;
  });

  if (!paymentId) throw new Error('payment_mark_failed');
  return { paymentId, idempotencyKey };
}

/**
 * Approve a payment (transactional).
 *
 * In production: must be called from Cloud Functions.
 */
export async function approvePayment(args: {
  paymentId: string;
  actorId: string;
}): Promise<void> {
  const { paymentId, actorId } = args;

  // Pre-read to obtain tenant/team for centralized authz.
  const preSnap = await firestore().collection('payments').doc(paymentId).get();
  if (!preSnap.exists) throw new Error('payment_not_found');
  const pre = (preSnap.data() || {}) as Record<string, unknown>;
  const teamId = pre.teamId as string | undefined;
  if (!teamId) throw new Error('payment_missing_teamId');

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.PAYMENT_APPROVE,
    resourceType: 'payment',
    resourceId: paymentId,
  });
  assertAllowed(decision);

  const paymentRef = firestore().collection('payments').doc(paymentId);
  const auditRef = firestore().collection('audits').doc();

  await firestore().runTransaction(async (tx) => {
    const snap = await tx.get(paymentRef);
    if (!snap.exists) throw new Error('payment_not_found');
    const d = (snap.data() || {}) as Record<string, unknown>;
    const txTeamId = d.teamId as string | undefined;
    if (!txTeamId || txTeamId !== teamId) throw new Error('payment_team_mismatch');

    const status = d.status as string | undefined;
    if (status === 'PAID') return; // idempotent

    tx.update(paymentRef, {
      status: 'PAID',
      approvedAt: firestore.FieldValue.serverTimestamp(),
      approvedBy: actorId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'PAYMENT_APPROVE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'payment', id: paymentId },
    });
  });
}

