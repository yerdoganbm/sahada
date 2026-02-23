import firestore from '@react-native-firebase/firestore';
import type { Actor } from '../domain/model';
import type { MembershipStatus } from '../domain/model';
import { planMembershipTransition, type MembershipDocument, type TransitionMeta } from '../domain/membershipStateMachine';

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
 * Transactional membership status transition (optimistic lock via transaction retries)
 * + atomic audit record.
 *
 * NOTE: Authorization must be enforced by caller (client-side only = UX).
 * In production, this function should be invoked by Cloud Functions.
 */
export async function transitionMembership(args: {
  teamId: string;
  userId: string;
  nextStatus: MembershipStatus;
  actorId: string;
  meta?: Omit<TransitionMeta, 'now'> & { auditMeta?: Record<string, unknown> };
}): Promise<void> {
  const { teamId, userId, nextStatus, actorId, meta } = args;

  const membershipRef = firestore().collection('memberships').doc(membershipDocId(teamId, userId));
  const auditRef = firestore().collection('audits').doc();

  await firestore().runTransaction(async (tx) => {
    const snap = await tx.get(membershipRef);
    if (!snap.exists) {
      throw new Error('membership_not_found');
    }

    const d = (snap.data() || {}) as Record<string, unknown>;
    const now = new Date();

    const membership: MembershipDocument = {
      tenantId: teamId,
      teamId,
      orgId: (d.orgId as string | undefined) ?? undefined,
      userId,
      roleId: (d.roleId as string) ?? 'MEMBER',
      status: (d.status as MembershipStatus) ?? ('ACTIVE' as MembershipStatus),
      version: typeof d.version === 'number' ? d.version : 0,
      bannedRoleSnapshot: d.bannedRoleSnapshot as string | undefined,
      leftAt: toDateMaybe(d.leftAt),
      rejectedAt: toDateMaybe(d.rejectedAt),
      banEnd: toDateMaybe(d.banEnd),
    };

    const actor: Actor = {
      uid: actorId,
      teamRoles: new Map(),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map(),
      subscription: 'free',
    };

    const { update, audit } = planMembershipTransition({
      membership,
      nextStatus,
      actor,
      meta: {
        now,
        leftAt: membership.leftAt,
        rejectedAt: membership.rejectedAt,
        banEnd: meta?.banEnd ?? membership.banEnd,
        adminOverride: meta?.adminOverride,
        auditMeta: meta?.auditMeta,
      },
    });

    if (!update || !audit) return;

    tx.update(membershipRef, {
      status: update.status,
      version: update.version,
      previousStatus: update.previousStatus,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: update.updatedBy,
      ...(update.roleId ? { roleId: update.roleId } : {}),
      ...(update.bannedRoleSnapshot ? { bannedRoleSnapshot: update.bannedRoleSnapshot } : {}),
      ...(update.leftAt ? { leftAt: update.leftAt } : {}),
      ...(update.rejectedAt ? { rejectedAt: update.rejectedAt } : {}),
      ...(update.banEnd ? { banEnd: update.banEnd } : {}),
    } as any);

    tx.set(auditRef, {
      at: firestore.FieldValue.serverTimestamp(),
      actorId: audit.actorId,
      action: audit.action,
      scope: 'TEAM',
      scopeId: teamId,
      target: { type: 'membership', id: snap.id },
      meta: {
        subjectUserId: audit.subjectUserId,
        from: audit.from,
        to: audit.to,
        membershipVersion: audit.membershipVersion,
        ...(audit.meta ? { auditMeta: audit.meta } : {}),
      },
    });
  });
}

