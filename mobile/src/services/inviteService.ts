import firestore from '@react-native-firebase/firestore';
import type { MembershipStatus } from '../domain/model';
import { MembershipStatus as MS } from '../domain/model';
import { BuiltInPermissionId } from '../domain/roleRegistry';
import { planMembershipTransition, type MembershipDocument } from '../domain/membershipStateMachine';
import { assertAllowed, authorizeTeamAction } from './authz';
import { generateInviteTokenHex, sha256Hex } from '../utils/token';

export type InviteTarget =
  | { type: 'PHONE'; value: string }
  | { type: 'EMAIL'; value: string }
  | { type: 'USER_ID'; value: string };

export type InviteStatus = 'INVITED' | 'ACCEPTED' | 'CANCELLED' | 'INVITE_EXPIRED';

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

export async function createInvite(args: {
  teamId: string;
  inviterId: string;
  target: InviteTarget;
  roleId: string;
  ttlHours?: number;
}): Promise<{ token: string; inviteId: string; tokenHash: string; expiresAt: Date }> {
  const { teamId, inviterId, target, roleId } = args;
  const ttlHours = typeof args.ttlHours === 'number' && args.ttlHours > 0 ? args.ttlHours : 48;

  const { decision } = await authorizeTeamAction({
    actorId: inviterId,
    teamId,
    action: BuiltInPermissionId.MEMBER_INVITE,
    resourceType: 'invite',
    resourceId: teamId,
  });
  assertAllowed(decision);

  const token = generateInviteTokenHex(20);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const inviteRef = firestore().collection('invites').doc();
  const auditRef = firestore().collection('audits').doc();

  await firestore().runTransaction(async (tx) => {
    // If the target is a known user, ensure membership is created/updated to INVITED.
    if (target.type === 'USER_ID') {
      const userId = target.value;

      const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
      const joinReqRef = firestore().collection('join_requests').doc(joinRequestDocId(teamId, userId));

      const [mSnap, jrSnap] = await Promise.all([tx.get(membershipRef), tx.get(joinReqRef)]);
      const m = (mSnap.data() || {}) as Record<string, unknown>;

      const currentStatus = (m.status as MembershipStatus | undefined) ?? undefined;
      if (currentStatus === MS.ACTIVE) {
        throw new Error('membership_already_active');
      }
      if (currentStatus === MS.BANNED || currentStatus === MS.SUSPENDED || currentStatus === MS.TEMP_BANNED) {
        throw new Error(`membership_blocked:${currentStatus}`);
      }

      // Race handling: if an approval join request exists, supersede it with the invite.
      if (jrSnap.exists) {
        const jr = (jrSnap.data() || {}) as Record<string, unknown>;
        const jrStatus = jr.status as string | undefined;
        if (jrStatus === 'REQUESTED') {
          tx.update(joinReqRef, {
            status: 'CANCELLED',
            cancelledAt: firestore.FieldValue.serverTimestamp(),
            cancelledBy: inviterId,
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
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: inviterId,
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
          nextStatus: MS.INVITED,
          actor: {
            uid: inviterId,
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
            updatedBy: inviterId,
            roleId, // invite sets desired role for when accepted
          });
        }
      }
    }

    tx.set(inviteRef, {
      teamId,
      inviterId,
      target,
      roleId,
      tokenHash,
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
      status: 'INVITED' as InviteStatus,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: inviterId,
      action: 'INVITE_CREATE',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'invite', id: inviteRef.id },
      meta: {
        target,
        roleId,
        expiresAt: expiresAt.toISOString(),
        tokenHashPrefix: tokenHash.slice(0, 8), // avoid storing full hash twice
      },
    });
  });

  return { token, inviteId: inviteRef.id, tokenHash, expiresAt };
}

export async function acceptInvite(args: {
  token: string;
  userId: string;
}): Promise<{ teamId: string; roleId: string }> {
  const { token, userId } = args;
  const tokenHash = sha256Hex(token.trim());

  const snap = await firestore()
    .collection('invites')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();
  if (snap.empty) {
    throw new Error('invite_not_found');
  }
  const inviteRef = snap.docs[0].ref;

  const auditRef = firestore().collection('audits').doc();

  let result: { teamId: string; roleId: string } | null = null;

  await firestore().runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new Error('invite_not_found');
    const invite = (inviteSnap.data() || {}) as Record<string, unknown>;

    const status = invite.status as InviteStatus | undefined;
    const teamId = invite.teamId as string | undefined;
    const roleId = invite.roleId as string | undefined;
    const expiresAt = toDateMaybe(invite.expiresAt);

    if (!teamId || !roleId) throw new Error('invite_invalid');

    if (status === 'ACCEPTED') {
      const acceptedBy = invite.acceptedBy as string | undefined;
      if (acceptedBy && acceptedBy !== userId) throw new Error('invite_already_used');
      result = { teamId, roleId };
      return;
    }
    if (status !== 'INVITED') throw new Error(`invite_not_active:${status ?? 'unknown'}`);

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      tx.update(inviteRef, { status: 'INVITE_EXPIRED' as InviteStatus });
      throw new Error('invite_expired');
    }

    const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
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
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
    } else {
      const m = (mSnap.data() || {}) as Record<string, unknown>;
      const currentStatus = (m.status as MembershipStatus | undefined) ?? MS.ACTIVE;
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
          uid: userId,
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
          updatedBy: userId,
          roleId,
        });
      }
    }

    // One-time use: mark invite accepted.
    tx.update(inviteRef, {
      status: 'ACCEPTED' as InviteStatus,
      acceptedAt: firestore.FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    // Legacy selector: move activeTeamId + teamId for UX.
    tx.set(
      firestore().collection('users').doc(userId),
      { activeTeamId: teamId, teamId, authzMigrationVersion: 1, authzMigrationAt: firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: userId,
      action: 'INVITE_ACCEPT',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'invite', id: inviteRef.id },
      meta: { roleId },
    });

    result = { teamId, roleId };
  });

  if (!result) throw new Error('invite_accept_failed');
  return result;
}

