import firestore from '@react-native-firebase/firestore';
import { BuiltInPermissionId } from '../domain/roleRegistry';
import type { MembershipStatus } from '../domain/model';
import { MembershipStatus as MS, TeamRoleId } from '../domain/model';
import { assertAllowed, authorizeTeamAction } from './authz';

export type OwnerTransferStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

function membershipDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`;
}

function toDateMaybe(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const asAny = v as { toDate?: () => Date };
  if (typeof asAny?.toDate === 'function') return asAny.toDate();
  return undefined;
}

/**
 * Start ownership transfer for a team.
 *
 * Two-phase: creates/overwrites `owner_transfers/{teamId}` intent with 24h expiry.
 * In production this must be invoked from Cloud Functions.
 */
export async function startOwnerTransfer(args: {
  teamId: string;
  currentOwnerId: string;
  newOwnerId: string;
  ttlHours?: number;
}): Promise<{ transferId: string; expiresAt: Date }> {
  const { teamId, currentOwnerId, newOwnerId } = args;
  const ttlHours = typeof args.ttlHours === 'number' && args.ttlHours > 0 ? args.ttlHours : 24;
  if (currentOwnerId === newOwnerId) throw new Error('owner_transfer_same_user');

  const teamRef = firestore().collection('teams').doc(teamId);
  const transferRef = firestore().collection('owner_transfers').doc(teamId);
  const auditRef = firestore().collection('audits').doc();

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Pre-authorize outside the transaction (rules: no extra reads inside tx).
  const teamPre = await teamRef.get();
  if (!teamPre.exists) throw new Error('team_not_found');
  const teamPreData = (teamPre.data() || {}) as Record<string, unknown>;
  const teamOwnerIdPre = (teamPreData.ownerId as string | undefined) ?? undefined;
  const effectiveOwnerIdPre = teamOwnerIdPre ?? currentOwnerId;
  const { decision } = await authorizeTeamAction({
    actorId: currentOwnerId,
    teamId,
    action: BuiltInPermissionId.TEAM_OWNER_TRANSFER_START,
    resourceType: 'team',
    resourceId: teamId,
    resourceOwnerId: effectiveOwnerIdPre,
  });
  assertAllowed(decision);

  await firestore().runTransaction(async (tx) => {
    const [teamSnap, transferSnap] = await Promise.all([tx.get(teamRef), tx.get(transferRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');
    const team = (teamSnap.data() || {}) as Record<string, unknown>;

    const teamOwnerId = (team.ownerId as string | undefined) ?? undefined;
    const effectiveOwnerId = teamOwnerId ?? currentOwnerId;
    // TOCTOU guard: re-check owner identity inside transaction.
    if (teamOwnerId && teamOwnerId !== currentOwnerId) {
      throw new Error('not_team_owner');
    }

    // Bootstrap legacy teams missing ownerId (best-effort, deterministic).
    if (!teamOwnerId) {
      tx.update(teamRef, { ownerId: currentOwnerId });
      const ownerMembershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, currentOwnerId));
      const mSnap = await tx.get(ownerMembershipRef);
      if (mSnap.exists) {
        const m = (mSnap.data() || {}) as Record<string, unknown>;
        const status = (m.status as MembershipStatus | undefined) ?? undefined;
        if (status === MS.ACTIVE && m.roleId !== TeamRoleId.TEAM_OWNER) {
          tx.update(ownerMembershipRef, {
            roleId: TeamRoleId.TEAM_OWNER,
            updatedAt: firestore.FieldValue.serverTimestamp(),
            updatedBy: currentOwnerId,
          });
        }
      }
    }

    // Prevent multiple overlapping transfers unless expired/cancelled.
    if (transferSnap.exists) {
      const t = (transferSnap.data() || {}) as Record<string, unknown>;
      const st = (t.status as OwnerTransferStatus | undefined) ?? undefined;
      const prevExpiresAt = toDateMaybe(t.expiresAt);
      const isExpired = prevExpiresAt ? prevExpiresAt.getTime() <= Date.now() : false;
      if (st === 'PENDING' && !isExpired) {
        throw new Error('owner_transfer_already_pending');
      }
    }

    tx.set(transferRef, {
      teamId,
      currentOwnerId: effectiveOwnerId,
      newOwnerId,
      status: 'PENDING' as OwnerTransferStatus,
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: currentOwnerId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: currentOwnerId,
    });

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: currentOwnerId,
      action: 'OWNER_TRANSFER_START',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'owner_transfer', id: transferRef.id },
      meta: { newOwnerId, expiresAt: expiresAt.toISOString() },
    });
  });

  return { transferId: transferRef.id, expiresAt };
}

/**
 * Confirm ownership transfer by the target user.
 *
 * Transaction:
 * - Verify intent exists, not expired, target matches
 * - Update `teams.ownerId`
 * - Demote old owner to TEAM_ADMIN
 * - Promote new owner to TEAM_OWNER
 * - Delete intent
 * - Write audit
 */
export async function confirmOwnerTransfer(args: {
  teamId: string;
  newOwnerId: string;
}): Promise<void> {
  const { teamId, newOwnerId } = args;

  const teamRef = firestore().collection('teams').doc(teamId);
  const transferRef = firestore().collection('owner_transfers').doc(teamId);
  const auditRef = firestore().collection('audits').doc();

  // Pre-authorize outside transaction (ABAC: resource.ownerId must match actor).
  const { decision } = await authorizeTeamAction({
    actorId: newOwnerId,
    teamId,
    action: BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM,
    resourceType: 'team',
    resourceId: teamId,
    resourceOwnerId: newOwnerId,
  });
  assertAllowed(decision);

  await firestore().runTransaction(async (tx) => {
    const [teamSnap, transferSnap] = await Promise.all([tx.get(teamRef), tx.get(transferRef)]);
    if (!teamSnap.exists) throw new Error('team_not_found');
    if (!transferSnap.exists) throw new Error('owner_transfer_not_found');

    const team = (teamSnap.data() || {}) as Record<string, unknown>;
    const transfer = (transferSnap.data() || {}) as Record<string, unknown>;

    const status = (transfer.status as OwnerTransferStatus | undefined) ?? undefined;
    if (status !== 'PENDING') throw new Error(`owner_transfer_not_pending:${status ?? 'unknown'}`);

    const expiresAt = toDateMaybe(transfer.expiresAt);
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      tx.update(transferRef, { status: 'EXPIRED' as OwnerTransferStatus, updatedAt: firestore.FieldValue.serverTimestamp() });
      throw new Error('owner_transfer_expired');
    }

    const currentOwnerId = (transfer.currentOwnerId as string | undefined) ?? (team.ownerId as string | undefined);
    const intendedNewOwnerId = transfer.newOwnerId as string | undefined;
    if (!currentOwnerId || !intendedNewOwnerId) throw new Error('owner_transfer_invalid');
    if (intendedNewOwnerId !== newOwnerId) throw new Error('owner_transfer_target_mismatch');

    // Membership docs (must exist and be ACTIVE).
    const oldOwnerMembershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, currentOwnerId));
    const newOwnerMembershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, newOwnerId));
    const [oldSnap, newSnap] = await Promise.all([tx.get(oldOwnerMembershipRef), tx.get(newOwnerMembershipRef)]);
    if (!newSnap.exists) throw new Error('new_owner_membership_missing');
    const newM = (newSnap.data() || {}) as Record<string, unknown>;
    if ((newM.status as MembershipStatus | undefined) !== MS.ACTIVE) throw new Error('new_owner_membership_not_active');

    // Update team ownerId.
    tx.update(teamRef, {
      ownerId: newOwnerId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: newOwnerId,
    });

    // Demote old owner (if membership exists and active).
    if (oldSnap.exists) {
      const oldM = (oldSnap.data() || {}) as Record<string, unknown>;
      if ((oldM.status as MembershipStatus | undefined) === MS.ACTIVE) {
        tx.update(oldOwnerMembershipRef, {
          roleId: TeamRoleId.TEAM_ADMIN,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          updatedBy: newOwnerId,
        });
      }
    }

    // Promote new owner.
    tx.update(newOwnerMembershipRef, {
      roleId: TeamRoleId.TEAM_OWNER,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: newOwnerId,
    });

    // Delete/close intent.
    tx.delete(transferRef);

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: newOwnerId,
      action: 'OWNER_TRANSFER_CONFIRM',
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'team', id: teamId },
      meta: { from: currentOwnerId, to: newOwnerId },
    });
  });
}

