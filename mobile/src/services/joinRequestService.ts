import firestore from '@react-native-firebase/firestore';
import type { MembershipStatus } from '../domain/model';
import { MembershipStatus as MS } from '../domain/model';
import { BuiltInPermissionId } from '../domain/roleRegistry';
import { planMembershipTransition, type MembershipDocument } from '../domain/membershipStateMachine';
import { assertAllowed, authorizeTeamAction } from './authz';

export type JoinPolicy = 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
export type JoinRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface JoinRequestDoc {
  id: string;
  teamId: string;
  userId: string;
  status: JoinRequestStatus;
  createdAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string;
  rejectedAt?: unknown;
  rejectedBy?: string;
}

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

function parseJoinPolicy(v: unknown): JoinPolicy {
  if (v === 'OPEN' || v === 'APPROVAL' || v === 'INVITE_ONLY') return v;
  return 'OPEN';
}

export async function getJoinPolicy(teamId: string): Promise<JoinPolicy> {
  const snap = await firestore().collection('teams').doc(teamId).get();
  if (!snap.exists) return 'OPEN';
  const d = (snap.data() || {}) as Record<string, unknown>;
  return parseJoinPolicy(d.joinPolicy);
}

export async function requestJoin(args: {
  teamId: string;
  userId: string;
}): Promise<{ status: 'ACTIVE' | 'REQUESTED'; teamId: string }> {
  const { teamId, userId } = args;

  const teamRef = firestore().collection('teams').doc(teamId);
  const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
  const joinReqRef = firestore().collection('join_requests').doc(joinRequestDocId(teamId, userId));
  const auditRef = firestore().collection('audits').doc();

  let out: { status: 'ACTIVE' | 'REQUESTED'; teamId: string } | null = null;

  await firestore().runTransaction(async (tx) => {
    const [teamSnap, mSnap, jrSnap] = await Promise.all([tx.get(teamRef), tx.get(membershipRef), tx.get(joinReqRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');

    const team = (teamSnap.data() || {}) as Record<string, unknown>;
    const joinPolicy = parseJoinPolicy(team.joinPolicy);

    if (joinPolicy === 'INVITE_ONLY') throw new Error('join_policy_invite_only');

    const now = new Date();

    const m = (mSnap.data() || {}) as Record<string, unknown>;
    const currentStatus = (m.status as MembershipStatus | undefined) ?? undefined;

    if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
      throw new Error(`membership_blocked:${currentStatus}`);
    }
    if (currentStatus === MS.ACTIVE) {
      out = { status: 'ACTIVE', teamId };
      return;
    }
    if (currentStatus === MS.INVITED) {
      // Security: invites should be accepted via token, not via join request.
      throw new Error('membership_invited_requires_token');
    }

    if (joinPolicy === 'OPEN') {
      if (!mSnap.exists) {
        tx.set(membershipRef, {
          teamId,
          userId,
          roleId: 'MEMBER',
          status: MS.ACTIVE,
          version: 1,
          previousStatus: null,
          bannedRoleSnapshot: null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: userId,
        });
      } else {
        const membership: MembershipDocument = {
          tenantId: teamId,
          teamId,
          userId,
          roleId: (m.roleId as string) ?? 'MEMBER',
          status: (m.status as MembershipStatus) ?? MS.ACTIVE,
          version: typeof m.version === 'number' ? m.version : 0,
          bannedRoleSnapshot: typeof m.bannedRoleSnapshot === 'string' ? (m.bannedRoleSnapshot as string) : undefined,
          leftAt: toDateMaybe(m.leftAt),
          rejectedAt: toDateMaybe(m.rejectedAt),
          banEnd: toDateMaybe(m.banEnd),
        };
        const { update } = planMembershipTransition({
          membership,
          nextStatus: MS.ACTIVE,
          actor: {
            uid: userId,
            teamRoles: new Map(),
            orgRoles: new Map(),
            membershipStatusByTenant: new Map(),
            subscription: 'free',
          },
          meta: {
            now,
            leftAt: membership.leftAt,
            rejectedAt: membership.rejectedAt,
            banEnd: membership.banEnd,
          },
        });
        if (update) {
          tx.update(membershipRef, {
            status: update.status,
            version: update.version,
            previousStatus: update.previousStatus,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
          });
        }
      }

      // UX: set active team selectors.
      tx.set(
        firestore().collection('users').doc(userId),
        { activeTeamId: teamId, teamId, authzMigrationVersion: 1, authzMigrationAt: firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      // If there was a pending join request, cancel it as resolved.
      if (jrSnap.exists) {
        const jr = (jrSnap.data() || {}) as Record<string, unknown>;
        const jrStatus = jr.status as string | undefined;
        if (jrStatus === 'REQUESTED') {
          tx.update(joinReqRef, {
            status: 'CANCELLED' as JoinRequestStatus,
            cancelledAt: firestore.FieldValue.serverTimestamp(),
            cancelledBy: userId,
            cancelledReason: 'auto_join_open_policy',
          });
        }
      }

      tx.set(auditRef, {
        at: firestore.FieldValue.serverTimestamp(),
        actorId: userId,
        action: 'JOIN_OPEN_POLICY',
        scope: 'TEAM',
        scopeId: teamId,
        target: { type: 'membership', id: membershipRef.id },
      });

      out = { status: 'ACTIVE', teamId };
      return;
    }

    // APPROVAL policy
    if (!jrSnap.exists) {
      tx.set(joinReqRef, {
        teamId,
        userId,
        status: 'REQUESTED' as JoinRequestStatus,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const jr = (jrSnap.data() || {}) as Record<string, unknown>;
      const jrStatus = jr.status as JoinRequestStatus | undefined;
      if (jrStatus === 'REJECTED') {
        // enforce cooldown via membership state machine if membership doc exists
        // (legacy: allow by creating membership REQUESTED if no membership doc)
      }
      if (jrStatus === 'APPROVED') {
        out = { status: 'ACTIVE', teamId };
        return;
      }
      if (jrStatus === 'CANCELLED') {
        tx.update(joinReqRef, { status: 'REQUESTED' as JoinRequestStatus, createdAt: firestore.FieldValue.serverTimestamp() });
      }
    }

    if (!mSnap.exists) {
      tx.set(membershipRef, {
        teamId,
        userId,
        roleId: 'MEMBER',
        status: MS.REQUESTED,
        version: 1,
        previousStatus: null,
        bannedRoleSnapshot: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
    } else {
      const membership: MembershipDocument = {
        tenantId: teamId,
        teamId,
        userId,
        roleId: (m.roleId as string) ?? 'MEMBER',
        status: (m.status as MembershipStatus) ?? MS.ACTIVE,
        version: typeof m.version === 'number' ? m.version : 0,
        bannedRoleSnapshot: typeof m.bannedRoleSnapshot === 'string' ? (m.bannedRoleSnapshot as string) : undefined,
        leftAt: toDateMaybe(m.leftAt),
        rejectedAt: toDateMaybe(m.rejectedAt),
        banEnd: toDateMaybe(m.banEnd),
      };
      const { update } = planMembershipTransition({
        membership,
        nextStatus: MS.REQUESTED,
        actor: {
          uid: userId,
          teamRoles: new Map(),
          orgRoles: new Map(),
          membershipStatusByTenant: new Map(),
          subscription: 'free',
        },
        meta: {
          now,
          leftAt: membership.leftAt,
          rejectedAt: membership.rejectedAt,
          banEnd: membership.banEnd,
        },
      });
      if (update) {
        tx.update(membershipRef, {
          status: update.status,
          version: update.version,
          previousStatus: update.previousStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: userId,
          rejectedAt: firestore.FieldValue.delete(),
        } as any);
      }
    }

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: userId,
      action: 'JOIN_REQUEST_CREATE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'join_request', id: joinReqRef.id },
    });

    out = { status: 'REQUESTED', teamId };
  });

  if (!out) throw new Error('request_join_failed');
  return out;
}

export async function listPendingJoinRequestsForTeam(teamId: string): Promise<JoinRequestDoc[]> {
  const snap = await firestore()
    .collection('join_requests')
    .where('teamId', '==', teamId)
    .where('status', '==', 'REQUESTED')
    .limit(100)
    .get();
  return snap.docs.map((d) => {
    const data = (d.data() || {}) as Record<string, unknown>;
    return {
      id: d.id,
      teamId: (data.teamId as string) ?? '',
      userId: (data.userId as string) ?? '',
      status: (data.status as JoinRequestStatus) ?? 'REQUESTED',
      createdAt: data.createdAt,
      approvedAt: data.approvedAt,
      approvedBy: data.approvedBy as string | undefined,
      rejectedAt: data.rejectedAt,
      rejectedBy: data.rejectedBy as string | undefined,
    };
  });
}

export async function approveJoinRequest(args: {
  requestId: string;
  approverId: string;
}): Promise<{ teamId: string; userId: string }> {
  const { requestId, approverId } = args;
  const joinReqRef = firestore().collection('join_requests').doc(requestId);
  const auditRef = firestore().collection('audits').doc();

  // Pre-authorize outside the transaction to avoid non-transaction reads inside tx.
  const pre = await joinReqRef.get();
  if (!pre.exists) throw new Error('join_request_not_found');
  const preData = (pre.data() || {}) as Record<string, unknown>;
  const preTeamId = preData.teamId as string | undefined;
  if (!preTeamId) throw new Error('join_request_invalid');
  const { decision } = await authorizeTeamAction({
    actorId: approverId,
    teamId: preTeamId,
    action: BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    resourceType: 'join_request',
    resourceId: requestId,
  });
  assertAllowed(decision);

  let out: { teamId: string; userId: string } | null = null;

  await firestore().runTransaction(async (tx) => {
    const jrSnap = await tx.get(joinReqRef);
    if (!jrSnap.exists) throw new Error('join_request_not_found');
    const jr = (jrSnap.data() || {}) as Record<string, unknown>;
    const teamId = jr.teamId as string | undefined;
    const userId = jr.userId as string | undefined;
    const status = jr.status as JoinRequestStatus | undefined;
    if (!teamId || !userId) throw new Error('join_request_invalid');

    const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
    const mSnap = await tx.get(membershipRef);
    const m = (mSnap.data() || {}) as Record<string, unknown>;
    const currentStatus = (m.status as MembershipStatus | undefined) ?? undefined;

    if (status === 'APPROVED') {
      out = { teamId, userId };
      return;
    }
    if (status !== 'REQUESTED') throw new Error(`join_request_not_pending:${status ?? 'unknown'}`);

    if (!mSnap.exists) {
      tx.set(membershipRef, {
        teamId,
        userId,
        roleId: 'MEMBER',
        status: MS.ACTIVE,
        version: 1,
        previousStatus: null,
        bannedRoleSnapshot: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: approverId,
      });
    } else {
      if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
        throw new Error(`membership_blocked:${currentStatus}`);
      }

      const membership: MembershipDocument = {
        tenantId: teamId,
        teamId,
        userId,
        roleId: (m.roleId as string) ?? 'MEMBER',
        status: (m.status as MembershipStatus) ?? MS.ACTIVE,
        version: typeof m.version === 'number' ? m.version : 0,
        bannedRoleSnapshot: typeof m.bannedRoleSnapshot === 'string' ? (m.bannedRoleSnapshot as string) : undefined,
        leftAt: toDateMaybe(m.leftAt),
        rejectedAt: toDateMaybe(m.rejectedAt),
        banEnd: toDateMaybe(m.banEnd),
      };
      const { update } = planMembershipTransition({
        membership,
        nextStatus: MS.ACTIVE,
        actor: {
          uid: approverId,
          teamRoles: new Map(),
          orgRoles: new Map(),
          membershipStatusByTenant: new Map(),
          subscription: 'free',
        },
        meta: {
          now: new Date(),
          leftAt: membership.leftAt,
          rejectedAt: membership.rejectedAt,
          banEnd: membership.banEnd,
        },
      });
      if (update) {
        tx.update(membershipRef, {
          status: update.status,
          version: update.version,
          previousStatus: update.previousStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: approverId,
        });
      }
    }

    tx.update(joinReqRef, {
      status: 'APPROVED' as JoinRequestStatus,
      approvedAt: firestore.FieldValue.serverTimestamp(),
      approvedBy: approverId,
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: approverId,
      action: 'JOIN_REQUEST_APPROVE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'join_request', id: requestId },
      meta: { userId },
    });

    out = { teamId, userId };
  });

  if (!out) throw new Error('approve_join_failed');
  return out;
}

export async function rejectJoinRequest(args: {
  requestId: string;
  rejectorId: string;
}): Promise<{ teamId: string; userId: string }> {
  const { requestId, rejectorId } = args;
  const joinReqRef = firestore().collection('join_requests').doc(requestId);
  const auditRef = firestore().collection('audits').doc();

  // Pre-authorize outside the transaction to avoid non-transaction reads inside tx.
  const pre = await joinReqRef.get();
  if (!pre.exists) throw new Error('join_request_not_found');
  const preData = (pre.data() || {}) as Record<string, unknown>;
  const preTeamId = preData.teamId as string | undefined;
  if (!preTeamId) throw new Error('join_request_invalid');
  const { decision } = await authorizeTeamAction({
    actorId: rejectorId,
    teamId: preTeamId,
    action: BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    resourceType: 'join_request',
    resourceId: requestId,
  });
  assertAllowed(decision);

  let out: { teamId: string; userId: string } | null = null;

  await firestore().runTransaction(async (tx) => {
    const jrSnap = await tx.get(joinReqRef);
    if (!jrSnap.exists) throw new Error('join_request_not_found');
    const jr = (jrSnap.data() || {}) as Record<string, unknown>;
    const teamId = jr.teamId as string | undefined;
    const userId = jr.userId as string | undefined;
    const status = jr.status as JoinRequestStatus | undefined;
    if (!teamId || !userId) throw new Error('join_request_invalid');

    if (status === 'REJECTED') {
      out = { teamId, userId };
      return;
    }
    if (status !== 'REQUESTED') throw new Error(`join_request_not_pending:${status ?? 'unknown'}`);

    // Mirror status on membership for cooldown enforcement.
    const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
    const mSnap = await tx.get(membershipRef);
    if (mSnap.exists) {
      const m = (mSnap.data() || {}) as Record<string, unknown>;
      const membership: MembershipDocument = {
        tenantId: teamId,
        teamId,
        userId,
        roleId: (m.roleId as string) ?? 'MEMBER',
        status: (m.status as MembershipStatus) ?? MS.ACTIVE,
        version: typeof m.version === 'number' ? m.version : 0,
        bannedRoleSnapshot: typeof m.bannedRoleSnapshot === 'string' ? (m.bannedRoleSnapshot as string) : undefined,
        leftAt: toDateMaybe(m.leftAt),
        rejectedAt: toDateMaybe(m.rejectedAt),
        banEnd: toDateMaybe(m.banEnd),
      };
      const { update } = planMembershipTransition({
        membership,
        nextStatus: MS.REQUEST_REJECTED,
        actor: {
          uid: rejectorId,
          teamRoles: new Map(),
          orgRoles: new Map(),
          membershipStatusByTenant: new Map(),
          subscription: 'free',
        },
        meta: {
          now: new Date(),
          leftAt: membership.leftAt,
          rejectedAt: membership.rejectedAt,
          banEnd: membership.banEnd,
        },
      });
      if (update) {
        tx.update(membershipRef, {
          status: update.status,
          version: update.version,
          previousStatus: update.previousStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: rejectorId,
          rejectedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    tx.update(joinReqRef, {
      status: 'REJECTED' as JoinRequestStatus,
      rejectedAt: firestore.FieldValue.serverTimestamp(),
      rejectedBy: rejectorId,
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: rejectorId,
      action: 'JOIN_REQUEST_REJECT',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'join_request', id: requestId },
      meta: { userId },
    });

    out = { teamId, userId };
  });

  if (!out) throw new Error('reject_join_failed');
  return out;
}

