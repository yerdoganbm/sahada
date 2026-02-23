import admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { BuiltInPermissionId } from '../../mobile/src/domain/roleRegistry';
import { MembershipStatus as MS, TeamRoleId } from '../../mobile/src/domain/model';
import { requireAuth, invalidArg, permissionDenied } from './util/errors';
import { authorizeTeamAction } from './authz';
import { randomTokenHex, sha256Hex } from './util/hash';
import { paymentIdempotencyKey } from '../../mobile/src/domain/paymentIdempotency';
import { enforceRateLimit } from './rateLimit';

admin.initializeApp();

function membershipDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`;
}

function joinRequestDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`;
}

function toDateMaybe(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const asAny = v as { toDate?: () => Date };
  if (typeof asAny?.toDate === 'function') return asAny.toDate();
  return undefined;
}

function dateBucketUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function writeAudit(args: {
  actorId: string;
  action: string;
  scope: 'TEAM' | 'ORG' | 'GLOBAL';
  scopeId: string;
  decision?: { allowed: boolean; reason: string };
  target?: { type: string; id: string };
  meta?: Record<string, unknown>;
}): Promise<void> {
  const db = admin.firestore();
  await db.collection('audits').doc().set({
    at: admin.firestore.FieldValue.serverTimestamp(),
    actorId: args.actorId,
    action: args.action,
    scope: args.scope,
    scopeId: args.scopeId,
    ...(args.target ? { target: args.target } : {}),
    ...(args.decision ? { decision: args.decision } : {}),
    ...(args.meta ? { meta: args.meta } : {}),
  });
}

export const createInvite = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { teamId, target, roleId, ttlHours } = (req.data || {}) as {
    teamId?: string;
    target?: { type: 'PHONE' | 'EMAIL' | 'USER_ID'; value: string };
    roleId?: string;
    ttlHours?: number;
  };
  if (!teamId || !target || !target.type || !target.value || !roleId) throw invalidArg('Missing fields');

  // Rate limit: invite/hour per team
  await enforceRateLimit({
    key: `invite:${teamId}`,
    limit: 30,
    windowSeconds: 60 * 60,
    meta: { fn: 'createInvite' },
  });

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.MEMBER_INVITE,
    resourceType: 'invite',
    resourceId: teamId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'INVITE_CREATE', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const token = randomTokenHex(20);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + (typeof ttlHours === 'number' && ttlHours > 0 ? ttlHours : 48) * 60 * 60 * 1000);

  const db = admin.firestore();
  const inviteRef = db.collection('invites').doc();
  const auditRef = db.collection('audits').doc();

  await db.runTransaction(async (tx) => {
    if (target.type === 'USER_ID') {
      const userId = target.value;
      const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
      const joinReqRef = db.collection('join_requests').doc(joinRequestDocId(teamId, userId));
      const [mSnap, jrSnap] = await Promise.all([tx.get(membershipRef), tx.get(joinReqRef)]);
      const m = (mSnap.data() || {}) as Record<string, unknown>;
      const currentStatus = (m.status as string | undefined) ?? undefined;
      if (currentStatus === MS.ACTIVE) throw new Error('membership_already_active');
      if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
        throw new Error(`membership_blocked:${currentStatus}`);
      }
      if (jrSnap.exists) {
        const jr = (jrSnap.data() || {}) as Record<string, unknown>;
        if (jr.status === 'REQUESTED') {
          tx.update(joinReqRef, {
            status: 'CANCELLED',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledBy: actorId,
            cancelledReason: 'superseded_by_invite',
          });
        }
      }
      if (!mSnap.exists) {
        tx.set(membershipRef, {
          teamId,
          userId,
          roleId,
          status: MS.INVITED,
          version: 1,
          previousStatus: null,
          bannedRoleSnapshot: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorId,
        });
      } else {
        tx.update(membershipRef, {
          status: MS.INVITED,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: actorId,
          roleId,
        });
      }
    }

    tx.set(inviteRef, {
      teamId,
      inviterId: actorId,
      target,
      roleId,
      tokenHash,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      status: 'INVITED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'INVITE_CREATE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'invite', id: inviteRef.id },
      meta: { target, roleId, expiresAt: expiresAt.toISOString() },
    });
  });

  return { inviteId: inviteRef.id, token, expiresAt: expiresAt.toISOString() };
});

export const acceptInvite = onCall(async (req) => {
  const userId = requireAuth(req);
  const { token } = (req.data || {}) as { token?: string };
  if (!token) throw invalidArg('Missing token');

  const tokenHash = sha256Hex(String(token).trim());
  const db = admin.firestore();
  const snap = await db.collection('invites').where('tokenHash', '==', tokenHash).limit(1).get();
  if (snap.empty) throw permissionDenied('invite_not_found');

  const inviteRef = snap.docs[0].ref;
  const auditRef = db.collection('audits').doc();

  await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new Error('invite_not_found');
    const invite = (inviteSnap.data() || {}) as Record<string, unknown>;
    const status = invite.status as string | undefined;
    const teamId = invite.teamId as string | undefined;
    const roleId = invite.roleId as string | undefined;
    const expiresAt = toDateMaybe(invite.expiresAt);
    if (!teamId || !roleId) throw new Error('invite_invalid');

    if (status === 'ACCEPTED') {
      const acceptedBy = invite.acceptedBy as string | undefined;
      if (acceptedBy && acceptedBy !== userId) throw new Error('invite_already_used');
      return;
    }
    if (status !== 'INVITED') throw new Error(`invite_not_active:${status ?? 'unknown'}`);
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      tx.update(inviteRef, { status: 'INVITE_EXPIRED' });
      throw new Error('invite_expired');
    }

    const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
    const mSnap = await tx.get(membershipRef);
    if (!mSnap.exists) {
      tx.set(membershipRef, {
        teamId,
        userId,
        roleId,
        status: MS.ACTIVE,
        version: 1,
        previousStatus: null,
        bannedRoleSnapshot: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
    } else {
      const m = (mSnap.data() || {}) as Record<string, unknown>;
      const currentStatus = (m.status as string | undefined) ?? undefined;
      if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
        throw new Error(`membership_blocked:${currentStatus}`);
      }
      tx.update(membershipRef, {
        status: MS.ACTIVE,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
        roleId,
      });
    }

    tx.update(inviteRef, {
      status: 'ACCEPTED',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    tx.set(db.collection('users').doc(userId), { teamId, activeTeamId: teamId, authzMigrationVersion: 1 }, { merge: true });

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId: userId,
      action: 'INVITE_ACCEPT',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'invite', id: inviteRef.id },
      meta: { roleId },
    });
  });

  return { ok: true };
});

export const requestJoin = onCall(async (req) => {
  const userId = requireAuth(req);
  const { teamId } = (req.data || {}) as { teamId?: string };
  if (!teamId) throw invalidArg('Missing teamId');

  // Rate limit: joinRequest/hour per user
  await enforceRateLimit({
    key: `joinRequest:${userId}`,
    limit: 10,
    windowSeconds: 60 * 60,
    meta: { fn: 'requestJoin' },
  });

  const db = admin.firestore();
  const teamRef = db.collection('teams').doc(teamId);
  const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
  const joinReqRef = db.collection('join_requests').doc(joinRequestDocId(teamId, userId));
  const auditRef = db.collection('audits').doc();

  let statusOut: 'ACTIVE' | 'REQUESTED' = 'REQUESTED';

  await db.runTransaction(async (tx) => {
    const [teamSnap, mSnap, jrSnap] = await Promise.all([tx.get(teamRef), tx.get(membershipRef), tx.get(joinReqRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');
    const team = (teamSnap.data() || {}) as Record<string, unknown>;
    const joinPolicy = (team.joinPolicy as string | undefined) ?? 'OPEN';

    if (joinPolicy === 'INVITE_ONLY') throw new Error('join_policy_invite_only');

    const m = (mSnap.data() || {}) as Record<string, unknown>;
    const currentStatus = (m.status as string | undefined) ?? undefined;
    if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
      throw new Error(`membership_blocked:${currentStatus}`);
    }
    if (currentStatus === MS.ACTIVE) {
      statusOut = 'ACTIVE';
      return;
    }

    if (joinPolicy === 'OPEN') {
      if (!mSnap.exists) {
        tx.set(membershipRef, {
          teamId,
          userId,
          roleId: TeamRoleId.MEMBER,
          status: MS.ACTIVE,
          version: 1,
          previousStatus: null,
          bannedRoleSnapshot: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: userId,
        });
      } else {
        tx.update(membershipRef, {
          status: MS.ACTIVE,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: userId,
        });
      }
      if (jrSnap.exists) {
        const jr = (jrSnap.data() || {}) as Record<string, unknown>;
        if (jr.status === 'REQUESTED') {
          tx.update(joinReqRef, { status: 'CANCELLED', cancelledAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      }
      tx.set(db.collection('users').doc(userId), { teamId, activeTeamId: teamId, authzMigrationVersion: 1 }, { merge: true });
      tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId: userId, action: 'JOIN_OPEN_POLICY', scope: 'TEAM', scopeId: teamId });
      statusOut = 'ACTIVE';
      return;
    }

    // APPROVAL policy
    if (!jrSnap.exists) {
      tx.set(joinReqRef, { teamId, userId, status: 'REQUESTED', createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      const jr = (jrSnap.data() || {}) as Record<string, unknown>;
      const st = jr.status as string | undefined;
      if (st === 'APPROVED') {
        statusOut = 'ACTIVE';
        return;
      }
      if (st === 'CANCELLED') {
        tx.update(joinReqRef, { status: 'REQUESTED', createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    }
    if (!mSnap.exists) {
      tx.set(membershipRef, {
        teamId,
        userId,
        roleId: TeamRoleId.MEMBER,
        status: MS.REQUESTED,
        version: 1,
        previousStatus: null,
        bannedRoleSnapshot: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
    } else {
      tx.update(membershipRef, {
        status: MS.REQUESTED,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
    }
    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId: userId, action: 'JOIN_REQUEST_CREATE', scope: 'TEAM', scopeId: teamId });
    statusOut = 'REQUESTED';
  });

  return { teamId, status: statusOut };
});

export const approveJoinRequest = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { requestId } = (req.data || {}) as { requestId?: string };
  if (!requestId) throw invalidArg('Missing requestId');

  const db = admin.firestore();
  const jrRef = db.collection('join_requests').doc(requestId);
  const pre = await jrRef.get();
  if (!pre.exists) throw invalidArg('join_request_not_found');
  const preData = (pre.data() || {}) as Record<string, unknown>;
  const teamId = preData.teamId as string | undefined;
  if (!teamId) throw invalidArg('join_request_invalid');

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    resourceType: 'join_request',
    resourceId: requestId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'JOIN_REQUEST_APPROVE', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const auditRef = db.collection('audits').doc();
  await db.runTransaction(async (tx) => {
    const jrSnap = await tx.get(jrRef);
    if (!jrSnap.exists) throw new Error('join_request_not_found');
    const jr = (jrSnap.data() || {}) as Record<string, unknown>;
    const userId = jr.userId as string | undefined;
    const status = jr.status as string | undefined;
    if (!userId) throw new Error('join_request_invalid');
    if (status === 'APPROVED') return;
    if (status !== 'REQUESTED') throw new Error(`join_request_not_pending:${status ?? 'unknown'}`);

    const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
    const mSnap = await tx.get(membershipRef);
    if (!mSnap.exists) {
      tx.set(membershipRef, {
        teamId,
        userId,
        roleId: TeamRoleId.MEMBER,
        status: MS.ACTIVE,
        version: 1,
        previousStatus: null,
        bannedRoleSnapshot: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: actorId,
      });
    } else {
      tx.update(membershipRef, { status: MS.ACTIVE, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: actorId });
    }

    tx.update(jrRef, { status: 'APPROVED', approvedAt: admin.firestore.FieldValue.serverTimestamp(), approvedBy: actorId });
    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId, action: 'JOIN_REQUEST_APPROVE', scope: 'TEAM', scopeId: teamId, meta: { userId } });
  });

  return { ok: true };
});

export const startOwnerTransfer = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { teamId, newOwnerId, ttlHours } = (req.data || {}) as { teamId?: string; newOwnerId?: string; ttlHours?: number };
  if (!teamId || !newOwnerId) throw invalidArg('Missing fields');

  // Rate limit: owner transfer starts/day per team
  await enforceRateLimit({
    key: `ownerTransferStart:${teamId}`,
    limit: 5,
    windowSeconds: 24 * 60 * 60,
    meta: { fn: 'startOwnerTransfer' },
  });

  const db = admin.firestore();
  const teamRef = db.collection('teams').doc(teamId);
  const teamPre = await teamRef.get();
  if (!teamPre.exists) throw invalidArg('team_not_found');
  const team = (teamPre.data() || {}) as Record<string, unknown>;
  const ownerId = (team.ownerId as string | undefined) ?? actorId;

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.TEAM_OWNER_TRANSFER_START,
    resourceType: 'team',
    resourceId: teamId,
    resourceOwnerId: ownerId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'OWNER_TRANSFER_START', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const expiresAt = new Date(Date.now() + (typeof ttlHours === 'number' && ttlHours > 0 ? ttlHours : 24) * 60 * 60 * 1000);
  const transferRef = db.collection('owner_transfers').doc(teamId);
  const auditRef = db.collection('audits').doc();

  await db.runTransaction(async (tx) => {
    const [teamSnap, transferSnap] = await Promise.all([tx.get(teamRef), tx.get(transferRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');
    const t = (teamSnap.data() || {}) as Record<string, unknown>;
    if (t.ownerId && t.ownerId !== actorId) throw new Error('not_team_owner');

    if (transferSnap.exists) {
      const prev = (transferSnap.data() || {}) as Record<string, unknown>;
      const st = prev.status as string | undefined;
      const prevExpiresAt = toDateMaybe(prev.expiresAt);
      const isExpired = prevExpiresAt ? prevExpiresAt.getTime() <= Date.now() : false;
      if (st === 'PENDING' && !isExpired) throw new Error('owner_transfer_already_pending');
    }

    tx.set(transferRef, {
      teamId,
      currentOwnerId: actorId,
      newOwnerId,
      status: 'PENDING',
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: actorId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });

    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId, action: 'OWNER_TRANSFER_START', scope: 'TEAM', scopeId: teamId, meta: { newOwnerId, expiresAt: expiresAt.toISOString() } });
  });

  return { ok: true, expiresAt: expiresAt.toISOString() };
});

export const confirmOwnerTransfer = onCall(async (req) => {
  const newOwnerId = requireAuth(req);
  const { teamId } = (req.data || {}) as { teamId?: string };
  if (!teamId) throw invalidArg('Missing teamId');

  const db = admin.firestore();
  const teamRef = db.collection('teams').doc(teamId);
  const transferRef = db.collection('owner_transfers').doc(teamId);
  const auditRef = db.collection('audits').doc();

  const { decision } = await authorizeTeamAction({
    actorId: newOwnerId,
    teamId,
    action: BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM,
    resourceType: 'team',
    resourceId: teamId,
    resourceOwnerId: newOwnerId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId: newOwnerId, action: 'OWNER_TRANSFER_CONFIRM', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  await db.runTransaction(async (tx) => {
    const [teamSnap, transferSnap] = await Promise.all([tx.get(teamRef), tx.get(transferRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');
    if (!transferSnap.exists) throw new Error('owner_transfer_not_found');

    const transfer = (transferSnap.data() || {}) as Record<string, unknown>;
    const status = transfer.status as string | undefined;
    if (status !== 'PENDING') throw new Error('owner_transfer_not_pending');
    const expiresAt = toDateMaybe(transfer.expiresAt);
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      tx.update(transferRef, { status: 'EXPIRED', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      throw new Error('owner_transfer_expired');
    }

    const currentOwnerId = transfer.currentOwnerId as string | undefined;
    const intendedNewOwnerId = transfer.newOwnerId as string | undefined;
    if (!currentOwnerId || !intendedNewOwnerId) throw new Error('owner_transfer_invalid');
    if (intendedNewOwnerId !== newOwnerId) throw new Error('owner_transfer_target_mismatch');

    const oldOwnerMembershipRef = db.collection('memberships').doc(membershipDocId(teamId, currentOwnerId));
    const newOwnerMembershipRef = db.collection('memberships').doc(membershipDocId(teamId, newOwnerId));
    const [oldSnap, newSnap] = await Promise.all([tx.get(oldOwnerMembershipRef), tx.get(newOwnerMembershipRef)]);
    if (!newSnap.exists) throw new Error('new_owner_membership_missing');
    const newM = (newSnap.data() || {}) as Record<string, unknown>;
    if (newM.status !== MS.ACTIVE) throw new Error('new_owner_membership_not_active');

    tx.update(teamRef, { ownerId: newOwnerId, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: newOwnerId });
    if (oldSnap.exists) {
      const oldM = (oldSnap.data() || {}) as Record<string, unknown>;
      if (oldM.status === MS.ACTIVE) {
        tx.update(oldOwnerMembershipRef, { roleId: TeamRoleId.TEAM_ADMIN, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: newOwnerId });
      }
    }
    tx.update(newOwnerMembershipRef, { roleId: TeamRoleId.TEAM_OWNER, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: newOwnerId });
    tx.delete(transferRef);
    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId: newOwnerId, action: 'OWNER_TRANSFER_CONFIRM', scope: 'TEAM', scopeId: teamId, meta: { from: currentOwnerId, to: newOwnerId } });
  });

  return { ok: true };
});

export const markPayment = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { teamId, matchId, userId, userName, amount, proofUrl } = (req.data || {}) as {
    teamId?: string;
    matchId?: string;
    userId?: string;
    userName?: string;
    amount?: number;
    proofUrl?: string;
  };
  if (!teamId || !matchId || !userId || typeof amount !== 'number') throw invalidArg('Missing fields');
  if (!Number.isFinite(amount) || amount <= 0) throw invalidArg('invalid_amount');

  // Rate limit: paymentMark/min per admin
  await enforceRateLimit({
    key: `paymentMark:${actorId}`,
    limit: 10,
    windowSeconds: 60,
    meta: { fn: 'markPayment' },
  });

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.PAYMENT_MARK,
    resourceType: 'payment',
    resourceId: matchId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'PAYMENT_MARK', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const now = new Date();
  const dateBucket = dateBucketUTC(now);
  const idempotencyKey = paymentIdempotencyKey({ matchId, userId, amount, dateBucket });

  const db = admin.firestore();
  const idemRef = db.collection('payment_idempotency').doc(idempotencyKey);
  const paymentRef = db.collection('payments').doc();
  const auditRef = db.collection('audits').doc();

  let paymentId: string | null = null;
  await db.runTransaction(async (tx) => {
    const idemSnap = await tx.get(idemRef);
    if (idemSnap.exists) {
      const d = (idemSnap.data() || {}) as Record<string, unknown>;
      const existing = d.paymentId as string | undefined;
      if (existing) {
        paymentId = existing;
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
      markedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(idemRef, {
      teamId,
      matchId,
      userId,
      amount,
      dateBucket,
      paymentId: paymentRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: actorId,
    });
    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId, action: 'PAYMENT_MARK', scope: 'TEAM', scopeId: teamId, target: { type: 'payment', id: paymentRef.id } });
    paymentId = paymentRef.id;
  });

  if (!paymentId) throw new Error('payment_mark_failed');
  return { paymentId, idempotencyKey };
});

export const approvePayment = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { paymentId } = (req.data || {}) as { paymentId?: string };
  if (!paymentId) throw invalidArg('Missing paymentId');

  const db = admin.firestore();
  const paymentRef = db.collection('payments').doc(paymentId);
  const pre = await paymentRef.get();
  if (!pre.exists) throw invalidArg('payment_not_found');
  const preData = (pre.data() || {}) as Record<string, unknown>;
  const teamId = preData.teamId as string | undefined;
  if (!teamId) throw invalidArg('payment_missing_teamId');

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.PAYMENT_APPROVE,
    resourceType: 'payment',
    resourceId: paymentId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'PAYMENT_APPROVE', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const auditRef = db.collection('audits').doc();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(paymentRef);
    if (!snap.exists) throw new Error('payment_not_found');
    const d = (snap.data() || {}) as Record<string, unknown>;
    if (d.teamId !== teamId) throw new Error('payment_team_mismatch');
    if (d.status === 'PAID') return;
    tx.update(paymentRef, {
      status: 'PAID',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: actorId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });
    tx.set(auditRef, { at: admin.firestore.FieldValue.serverTimestamp(), actorId, action: 'PAYMENT_APPROVE', scope: 'TEAM', scopeId: teamId, target: { type: 'payment', id: paymentId } });
  });

  return { ok: true };
});

