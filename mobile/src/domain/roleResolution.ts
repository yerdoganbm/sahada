import type { Actor, Resource, RoleId, Scope } from './model';
import { OrgRoleId } from './model';
import { SYNTHETIC_ORG_OBSERVER_ROLE_ID } from './roleRegistry';

function scopeFor(resource: Resource): Scope {
  if (resource.teamId) return 'TEAM';
  if (resource.orgId) return 'ORG';
  return 'GLOBAL';
}

export function resolveRole(actor: Actor, resource: Resource): RoleId | null {
  const scope = scopeFor(resource);

  if (scope === 'GLOBAL') return actor.globalRole ?? null;

  if (scope === 'ORG') {
    if (!resource.orgId) return null;
    return actor.orgRoles.get(resource.orgId) ?? null;
  }

  // TEAM
  if (!resource.teamId) return null;

  const direct = actor.teamRoles.get(resource.teamId);
  if (direct) return direct;

  // ORG admins/owners get a synthetic observer role for teams in their org (read-only).
  if (resource.orgId) {
    const orgRole = actor.orgRoles.get(resource.orgId);
    if (orgRole === OrgRoleId.ORG_OWNER || orgRole === OrgRoleId.ORG_ADMIN) {
      return SYNTHETIC_ORG_OBSERVER_ROLE_ID;
    }
  }

  return null;
}

