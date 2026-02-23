import { TeamRoleId } from './model';

const TEAM_ROLE_RANK: Record<string, number> = {
  [TeamRoleId.GUEST]: 1,
  [TeamRoleId.MEMBER]: 2,
  [TeamRoleId.CAPTAIN]: 3,
  [TeamRoleId.TEAM_ADMIN]: 4,
  [TeamRoleId.TEAM_OWNER]: 5,
};

export function teamRoleRank(roleId: string | null | undefined): number {
  if (!roleId) return 0;
  return TEAM_ROLE_RANK[roleId] ?? 0;
}

/**
 * Privilege escalation prevention for team role changes.
 *
 * Rules:
 * - Unknown roles are not assignable by this flow (default deny)
 * - TEAM_OWNER cannot be assigned/removed via role change (must use owner transfer flow)
 * - Actor can only assign roles with rank <= actor rank
 */
export function canAssignTeamRole(args: {
  actorRoleId: string | null | undefined;
  targetCurrentRoleId?: string | null;
  desiredRoleId: string;
}): { ok: true } | { ok: false; reason: string } {
  const { actorRoleId, targetCurrentRoleId, desiredRoleId } = args;

  if (teamRoleRank(desiredRoleId) === 0) return { ok: false, reason: 'unknown_desired_role' };
  if (actorRoleId && teamRoleRank(actorRoleId) === 0) return { ok: false, reason: 'unknown_actor_role' };

  if (desiredRoleId === TeamRoleId.TEAM_OWNER) return { ok: false, reason: 'owner_role_requires_owner_transfer' };
  if (targetCurrentRoleId === TeamRoleId.TEAM_OWNER) return { ok: false, reason: 'cannot_modify_owner_role' };

  const actorRank = teamRoleRank(actorRoleId);
  const desiredRank = teamRoleRank(desiredRoleId);
  if (desiredRank > actorRank) return { ok: false, reason: 'cannot_assign_role_higher_than_self' };

  return { ok: true };
}

