import firestore from '@react-native-firebase/firestore';
import type { Actor, Context, MembershipStatus, Resource, SubscriptionTier } from '../domain/model';
import { authorize } from '../domain/authorize';

function membershipDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`;
}

function toSubscriptionTier(v: unknown): SubscriptionTier {
  if (v === 'premium' || v === 'partner' || v === 'free') return v;
  return 'free';
}

export async function buildActorForTeam(args: {
  uid: string;
  teamId: string;
}): Promise<Actor> {
  const { uid, teamId } = args;

  const [userSnap, membershipSnap] = await Promise.all([
    firestore().collection('users').doc(uid).get(),
    firestore().collection('memberships').doc(membershipDocId(teamId, uid)).get(),
  ]);

  const user = (userSnap.data() || {}) as Record<string, unknown>;
  const membership = (membershipSnap.data() || {}) as Record<string, unknown>;

  const subscription = toSubscriptionTier(user.subscription ?? user.tier);
  const roleId = typeof membership.roleId === 'string' ? membership.roleId : undefined;
  const status = typeof membership.status === 'string' ? (membership.status as MembershipStatus) : undefined;

  const actor: Actor = {
    uid,
    teamRoles: new Map(),
    orgRoles: new Map(),
    membershipStatusByTenant: new Map(),
    subscription,
  };

  if (status) actor.membershipStatusByTenant.set(teamId, status);
  if (status === 'ACTIVE' && roleId && roleId !== 'NONE') {
    actor.teamRoles.set(teamId, roleId);
  }

  return actor;
}

export async function authorizeTeamAction(args: {
  actorId: string;
  teamId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  context?: Partial<Context>;
}): Promise<{ actor: Actor; resource: Resource; decision: { allowed: boolean; reason: string } }> {
  const { actorId, teamId, action, resourceType, resourceId, context } = args;
  const actor = await buildActorForTeam({ uid: actorId, teamId });

  const resource: Resource = {
    type: resourceType ?? 'team',
    id: resourceId ?? teamId,
    teamId,
  };

  const decision = authorize(actor, resource, action, {
    time: new Date(),
    matchLive: context?.matchLive,
    matchState: context?.matchState,
    requestIp: context?.requestIp,
    sessionToken: context?.sessionToken,
    flags: context?.flags ?? {},
  });

  return { actor, resource, decision };
}

export function assertAllowed(decision: { allowed: boolean; reason: string }): void {
  if (!decision.allowed) {
    const err = new Error(`not_authorized:${decision.reason}`);
    (err as any).code = 'NOT_AUTHORIZED';
    throw err;
  }
}

