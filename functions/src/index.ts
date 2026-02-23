import admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { BuiltInPermissionId } from '../../mobile/src/domain/roleRegistry';
import { MembershipStatus as MS, TeamRoleId } from '../../mobile/src/domain/model';
import { requireAuth, invalidArg, permissionDenied } from './util/errors';
import { authorizeTeamAction } from './authz';
import { randomTokenHex, sha256Hex } from './util/hash';
import { paymentIdempotencyKey } from '../../mobile/src/domain/paymentIdempotency';
import { enforceRateLimit } from './rateLimit';
import { canAssignTeamRole } from '../../mobile/src/domain/roleHierarchy';
import { planMembershipTransition, type MembershipDocument } from '../../mobile/src/domain/membershipStateMachine';

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

  let out: { ok: true; teamId: string; roleId: string } | null = null;

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
      out = { ok: true, teamId, roleId };
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

    out = { ok: true, teamId, roleId };
  });

  if (!out) throw new Error('invite_accept_failed');
  return out;
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

export const rejectJoinRequest = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { requestId } = (req.data || {}) as { requestId?: string };
  if (!requestId) throw invalidArg('Missing requestId');

  const db = admin.firestore();
  const jrRef = db.collection('join_requests').doc(requestId);
  const pre = await jrRef.get();
  if (!pre.exists) throw invalidArg('join_request_not_found');
  const preData = (pre.data() || {}) as Record<string, unknown>;
  const teamId = preData.teamId as string | undefined;
  const userId = preData.userId as string | undefined;
  if (!teamId || !userId) throw invalidArg('join_request_invalid');

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    resourceType: 'join_request',
    resourceId: requestId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId, action: 'JOIN_REQUEST_REJECT', scope: 'TEAM', scopeId: teamId, decision });
    throw permissionDenied(decision.reason);
  }

  const auditRef = db.collection('audits').doc();
  await db.runTransaction(async (tx) => {
    const jrSnap = await tx.get(jrRef);
    if (!jrSnap.exists) throw new Error('join_request_not_found');
    const jr = (jrSnap.data() || {}) as Record<string, unknown>;
    const status = jr.status as string | undefined;
    if (status === 'REJECTED') return;
    if (status !== 'REQUESTED') throw new Error(`join_request_not_pending:${status ?? 'unknown'}`);

    const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
    const mSnap = await tx.get(membershipRef);
    if (mSnap.exists) {
      tx.update(membershipRef, {
        status: MS.REQUEST_REJECTED,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: actorId,
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    tx.update(jrRef, {
      status: 'REJECTED',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: actorId,
    });

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'JOIN_REQUEST_REJECT',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'join_request', id: requestId },
      meta: { userId },
    });
  });

  return { ok: true };
});

export const changeMemberRole = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { teamId, userId, roleId } = (req.data || {}) as { teamId?: string; userId?: string; roleId?: string };
  if (!teamId || !userId || !roleId) throw invalidArg('Missing fields');

  // Rate limit: role changes/min per admin
  await enforceRateLimit({
    key: `roleChange:${actorId}`,
    limit: 30,
    windowSeconds: 60,
    meta: { fn: 'changeMemberRole' },
  });

  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.MEMBER_ROLE_CHANGE,
    resourceType: 'membership',
    resourceId: `${teamId}_${userId}`,
  });
  if (!decision.allowed) {
    await writeAudit({
      actorId,
      action: 'ROLE_CHANGE',
      scope: 'TEAM',
      scopeId: teamId,
      decision,
      meta: { userId, roleId },
    });
    throw permissionDenied(decision.reason);
  }

  const db = admin.firestore();
  const actorMembershipRef = db.collection('memberships').doc(membershipDocId(teamId, actorId));
  const targetMembershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
  const auditRef = db.collection('audits').doc();

  await db.runTransaction(async (tx) => {
    const [actorSnap, targetSnap] = await Promise.all([tx.get(actorMembershipRef), tx.get(targetMembershipRef)]);
    if (!actorSnap.exists) throw new Error('actor_membership_missing');
    if (!targetSnap.exists) throw new Error('target_membership_missing');

    const actorM = (actorSnap.data() || {}) as Record<string, unknown>;
    const targetM = (targetSnap.data() || {}) as Record<string, unknown>;

    // Status gate (defense in depth)
    if (actorM.status !== MS.ACTIVE) throw new Error('actor_membership_not_active');
    if (targetM.status !== MS.ACTIVE) throw new Error('target_membership_not_active');

    const actorRoleId = actorM.roleId as string | undefined;
    const targetCurrentRoleId = targetM.roleId as string | undefined;

    const assign = canAssignTeamRole({
      actorRoleId,
      targetCurrentRoleId,
      desiredRoleId: roleId,
    });
    if (!assign.ok) throw new Error(`role_change_denied:${assign.reason}`);

    if (targetCurrentRoleId === roleId) return; // idempotent

    tx.update(targetMembershipRef, {
      roleId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: actorId,
    });

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'ROLE_CHANGE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'membership', id: targetMembershipRef.id },
      meta: { userId, from: targetCurrentRoleId ?? null, to: roleId },
    });
  });

  return { ok: true };
});

export const transitionMembershipStatus = onCall(async (req) => {
  const actorId = requireAuth(req);
  const { teamId, userId, nextStatus, meta } = (req.data || {}) as {
    teamId?: string;
    userId?: string;
    nextStatus?: string;
    meta?: { banEnd?: string; adminOverride?: boolean; auditMeta?: Record<string, unknown> };
  };
  if (!teamId || !userId || !nextStatus) throw invalidArg('Missing fields');

  // Rate limit: transitions/min per admin
  await enforceRateLimit({
    key: `membershipTransition:${actorId}`,
    limit: 60,
    windowSeconds: 60,
    meta: { fn: 'transitionMembershipStatus' },
  });

  // Authorization: reuse member-role-change permission for now (admin-only).
  const { decision } = await authorizeTeamAction({
    actorId,
    teamId,
    action: BuiltInPermissionId.MEMBER_ROLE_CHANGE,
    resourceType: 'membership',
    resourceId: `${teamId}_${userId}`,
  });
  if (!decision.allowed) {
    await writeAudit({
      actorId,
      action: 'MEMBERSHIP_STATUS_TRANSITION',
      scope: 'TEAM',
      scopeId: teamId,
      decision,
      meta: { userId, nextStatus },
    });
    throw permissionDenied(decision.reason);
  }

  const db = admin.firestore();
  const membershipRef = db.collection('memberships').doc(membershipDocId(teamId, userId));
  const auditRef = db.collection('audits').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(membershipRef);
    if (!snap.exists) throw new Error('membership_not_found');
    const d = (snap.data() || {}) as Record<string, unknown>;

    const membership: MembershipDocument = {
      tenantId: teamId,
      teamId,
      userId,
      orgId: (d.orgId as string | undefined) ?? undefined,
      roleId: (d.roleId as string) ?? 'MEMBER',
      status: (d.status as any) ?? MS.ACTIVE,
      version: typeof d.version === 'number' ? (d.version as number) : 0,
      bannedRoleSnapshot: typeof d.bannedRoleSnapshot === 'string' ? (d.bannedRoleSnapshot as string) : undefined,
      leftAt: toDateMaybe(d.leftAt),
      rejectedAt: toDateMaybe(d.rejectedAt),
      banEnd: toDateMaybe(d.banEnd),
    };

    const now = new Date();
    const banEnd = meta?.banEnd ? new Date(meta.banEnd) : membership.banEnd;

    const { update, audit } = planMembershipTransition({
      membership,
      nextStatus: nextStatus as any,
      actor: {
        uid: actorId,
        teamRoles: new Map(),
        orgRoles: new Map(),
        membershipStatusByTenant: new Map(),
        subscription: 'free',
      },
      meta: {
        now,
        leftAt: membership.leftAt,
        rejectedAt: membership.rejectedAt,
        banEnd,
        adminOverride: meta?.adminOverride === true,
        auditMeta: meta?.auditMeta,
      } as any,
    });

    if (!update || !audit) return;

    const payload: any = {
      status: update.status,
      version: update.version,
      previousStatus: update.previousStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: actorId,
    };
    if (update.roleId) payload.roleId = update.roleId;
    if (update.bannedRoleSnapshot) payload.bannedRoleSnapshot = update.bannedRoleSnapshot;
    if (update.leftAt) payload.leftAt = admin.firestore.Timestamp.fromDate(update.leftAt);
    if (update.rejectedAt) payload.rejectedAt = admin.firestore.Timestamp.fromDate(update.rejectedAt);
    if (update.banEnd) payload.banEnd = admin.firestore.Timestamp.fromDate(update.banEnd);

    tx.update(membershipRef, payload);

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId,
      action: 'MEMBERSHIP_STATUS_TRANSITION',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'membership', id: membershipRef.id },
      meta: {
        subjectUserId: userId,
        from: audit.from,
        to: audit.to,
        membershipVersion: update.version,
        ...(audit.meta ? { auditMeta: audit.meta } : {}),
      },
    });
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

export const rsvp = onCall(async (req) => {
  const userId = requireAuth(req);
  const { matchId, desiredState } = (req.data || {}) as { matchId?: string; desiredState?: 'GOING' | 'NOT_GOING' | 'MAYBE' };
  if (!matchId || !desiredState) throw invalidArg('Missing fields');
  if (desiredState !== 'GOING' && desiredState !== 'NOT_GOING' && desiredState !== 'MAYBE') throw invalidArg('invalid_state');

  await enforceRateLimit({
    key: `rsvp:${userId}`,
    limit: 30,
    windowSeconds: 60,
    meta: { fn: 'rsvp' },
  });

  const db = admin.firestore();
  const matchRef = db.collection('matches').doc(matchId);
  const matchPre = await matchRef.get();
  if (!matchPre.exists) throw invalidArg('match_not_found');
  const matchPreData = (matchPre.data() || {}) as Record<string, unknown>;
  const teamId = matchPreData.teamId as string | undefined;
  if (!teamId) throw invalidArg('match_missing_teamId');

  const { decision } = await authorizeTeamAction({
    actorId: userId,
    teamId,
    action: BuiltInPermissionId.MATCH_RSVP,
    resourceType: 'match',
    resourceId: matchId,
  });
  if (!decision.allowed) {
    await writeAudit({ actorId: userId, action: 'RSVP', scope: 'TEAM', scopeId: teamId, decision, target: { type: 'match', id: matchId } });
    throw permissionDenied(decision.reason);
  }

  const participantRef = matchRef.collection('participants').doc(userId);
  const waitlistRef = matchRef.collection('waitlist').doc(userId);
  const auditRef = db.collection('audits').doc();

  const toNumber = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

  await db.runTransaction(async (tx) => {
    const [matchSnap, partSnap, waitSnap] = await Promise.all([tx.get(matchRef), tx.get(participantRef), tx.get(waitlistRef)]);
    if (!matchSnap.exists) throw new Error('match_not_found');
    const match = (matchSnap.data() || {}) as Record<string, unknown>;

    const capacity = toNumber(match.capacity, 14);
    const waitlistEnabled = match.waitlistEnabled !== false;
    const goingCount = toNumber(match.goingCount, 0);
    const waitlistCount = toNumber(match.waitlistCount, 0);
    const waitlistSeq = toNumber(match.waitlistSeq, 0);

    const prevState = ((partSnap.data() || {}) as any)?.state as string | undefined;
    const prev = prevState === 'GOING' || prevState === 'WAITLIST' || prevState === 'NOT_GOING' || prevState === 'MAYBE' ? prevState : 'NOT_GOING';

    const setParticipant = (state: string) => {
      if (!partSnap.exists) {
        tx.set(participantRef, { userId, state, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        tx.update(participantRef, { state, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
    };

    const removeWaitlistIfPresent = () => {
      if (waitSnap.exists) {
        tx.delete(waitlistRef);
      }
    };

    // Transition logic
    if (desiredState === 'GOING') {
      if (prev === 'GOING') {
        // idempotent
      } else if (goingCount < capacity) {
        setParticipant('GOING');
        tx.update(matchRef, {
          goingCount: goingCount + 1,
          ...(prev === 'WAITLIST' && waitSnap.exists ? { waitlistCount: Math.max(0, waitlistCount - 1) } : {}),
        });
        removeWaitlistIfPresent();
      } else {
        if (!waitlistEnabled) {
          setParticipant('NOT_GOING');
        } else {
          setParticipant('WAITLIST');
          if (!waitSnap.exists) {
            const nextSeq = waitlistSeq + 1;
            tx.set(waitlistRef, { userId, queue: nextSeq, createdAt: admin.firestore.FieldValue.serverTimestamp() });
            tx.update(matchRef, { waitlistCount: waitlistCount + 1, waitlistSeq: nextSeq });
          }
        }
      }
    } else {
      // desired NOT_GOING or MAYBE
      const nextState = desiredState === 'NOT_GOING' ? 'NOT_GOING' : 'MAYBE';
      setParticipant(nextState);
      const nextUpdate: { goingCount?: number; waitlistCount?: number } = {};
      if (prev === 'GOING') {
        nextUpdate.goingCount = Math.max(0, goingCount - 1);
      }
      if (prev === 'WAITLIST' && waitSnap.exists) {
        nextUpdate.waitlistCount = Math.max(0, waitlistCount - 1);
        removeWaitlistIfPresent();
      }
      if (Object.keys(nextUpdate).length) {
        tx.update(matchRef, nextUpdate as any);
      }

      // Auto-promote waitlist if a GOING slot became free.
      const nextGoingCount = typeof nextUpdate.goingCount === 'number' ? (nextUpdate.goingCount as number) : goingCount;
      if (waitlistEnabled && prev === 'GOING' && nextGoingCount < capacity) {
        const q = matchRef
          .collection('waitlist')
          .orderBy('queue', 'asc')
          .orderBy(admin.firestore.FieldPath.documentId(), 'asc')
          .limit(1);
        // Firestore supports query reads inside transactions (Admin SDK).
        const waitQ = await tx.get(q as any);
        if (!waitQ.empty) {
          const nextDoc = waitQ.docs[0];
          const promoteUserId = nextDoc.id;
          const promoteParticipantRef = matchRef.collection('participants').doc(promoteUserId);
          const promoteWaitRef = matchRef.collection('waitlist').doc(promoteUserId);
          const promotePartSnap = await tx.get(promoteParticipantRef);

          if (!promotePartSnap.exists) {
            tx.set(promoteParticipantRef, { userId: promoteUserId, state: 'GOING', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          } else {
            tx.update(promoteParticipantRef, { state: 'GOING', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          }
          tx.delete(promoteWaitRef);
          tx.update(matchRef, {
            goingCount: nextGoingCount + 1,
            waitlistCount: Math.max(0, waitlistCount - 1),
          });
        }
      }
    }

    tx.set(auditRef, {
      at: admin.firestore.FieldValue.serverTimestamp(),
      actorId: userId,
      action: 'RSVP',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'match', id: matchId },
      meta: { desiredState, prevState: prev },
    });
  });

  return { ok: true };
});

// ─────────────────────────────────────────────────────────────
// Scheduled jobs (P3.3)
// ─────────────────────────────────────────────────────────────

async function jobAudit(args: { action: string; meta?: Record<string, unknown> }): Promise<void> {
  await writeAudit({
    actorId: 'system',
    action: args.action,
    scope: 'GLOBAL',
    scopeId: 'system',
    meta: args.meta,
  });
}

export const expireInvites = onSchedule('every 15 minutes', async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  let processed = 0;

  while (true) {
    const snap = await db
      .collection('invites')
      .where('status', '==', 'INVITED')
      .where('expiresAt', '<=', now)
      .orderBy('expiresAt', 'asc')
      .limit(400)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.update(doc.ref, {
        status: 'INVITE_EXPIRED',
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system',
      });
      processed++;
    }
    await batch.commit();
  }

  console.log(`[expireInvites] processed=${processed}`);
  await jobAudit({ action: 'JOB_EXPIRE_INVITES', meta: { processed } });
});

export const liftTempBans = onSchedule('every 5 minutes', async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  let processed = 0;

  while (true) {
    const snap = await db
      .collection('memberships')
      .where('status', '==', MS.TEMP_BANNED)
      .where('banEnd', '<=', now)
      .orderBy('banEnd', 'asc')
      .limit(300)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      const d = (doc.data() || {}) as Record<string, unknown>;
      const roleId = d.roleId as string | undefined;
      const snapshot = d.bannedRoleSnapshot as string | undefined;

      batch.update(doc.ref, {
        status: MS.ACTIVE,
        previousStatus: MS.TEMP_BANNED,
        version: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system',
        ...(roleId === 'NONE' && snapshot ? { roleId: snapshot } : {}),
        ...(snapshot ? { bannedRoleSnapshot: admin.firestore.FieldValue.delete() } : {}),
      });
      processed++;
    }
    await batch.commit();
  }

  console.log(`[liftTempBans] processed=${processed}`);
  await jobAudit({ action: 'JOB_LIFT_TEMP_BANS', meta: { processed } });
});

export const invariantsHealthCheck = onSchedule('every 15 minutes', async () => {
  const db = admin.firestore();
  let teamsChecked = 0;
  let violations = 0;

  const pageSize = 200;
  let last: admin.firestore.QueryDocumentSnapshot | undefined;

  while (true) {
    let q = db.collection('teams').limit(pageSize);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    for (const teamDoc of snap.docs) {
      teamsChecked++;
      const teamId = teamDoc.id;
      const team = (teamDoc.data() || {}) as Record<string, unknown>;
      const ownerId = team.ownerId as string | undefined;
      if (!ownerId) {
        violations++;
        console.warn(`[invariants] team_missing_ownerId teamId=${teamId}`);
        continue;
      }

      const ownerMembershipRef = db.collection('memberships').doc(membershipDocId(teamId, ownerId));
      const ownerMembershipSnap = await ownerMembershipRef.get();
      if (!ownerMembershipSnap.exists) {
        violations++;
        console.warn(`[invariants] owner_membership_missing teamId=${teamId} ownerId=${ownerId}`);
        continue;
      }
      const ownerMembership = (ownerMembershipSnap.data() || {}) as Record<string, unknown>;
      if (ownerMembership.status !== MS.ACTIVE || ownerMembership.roleId !== TeamRoleId.TEAM_OWNER) {
        violations++;
        console.warn(
          `[invariants] owner_membership_invalid teamId=${teamId} ownerId=${ownerId} status=${String(ownerMembership.status)} roleId=${String(ownerMembership.roleId)}`
        );
      }

      // DEG-01: at most one ACTIVE TEAM_OWNER membership.
      const ownersSnap = await db
        .collection('memberships')
        .where('teamId', '==', teamId)
        .where('status', '==', MS.ACTIVE)
        .where('roleId', '==', TeamRoleId.TEAM_OWNER)
        .limit(3)
        .get();
      if (ownersSnap.size !== 1) {
        violations++;
        console.warn(`[invariants] owner_count_invalid teamId=${teamId} count=${ownersSnap.size}`);
      }
    }

    last = snap.docs[snap.docs.length - 1];
  }

  console.log(`[invariantsHealthCheck] teamsChecked=${teamsChecked} violations=${violations}`);
  await jobAudit({ action: 'JOB_INVARIANTS_HEALTHCHECK', meta: { teamsChecked, violations } });
});

