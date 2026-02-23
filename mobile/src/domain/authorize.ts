import type { Actor, Context, Resource, Scope } from './model';
import { OrgRoleId, TeamRoleId, isBlockedStatus } from './model';
import {
  BuiltInPermissionId,
  PLATFORM_ADMIN_ROLE_ID,
  SYNTHETIC_ORG_OBSERVER_ROLE_ID,
  expandPermissions,
  isKnownPermissionId,
} from './roleRegistry';

export function resourceScope(resource: Resource): Scope {
  if (resource.teamId) return 'TEAM';
  if (resource.orgId) return 'ORG';
  return 'GLOBAL';
}

function tenantIdFor(resource: Resource): string | null {
  return resource.teamId ?? resource.orgId ?? null;
}

function resolveRoleId(actor: Actor, resource: Resource): string | null {
  const scope = resourceScope(resource);

  if (scope === 'GLOBAL') return actor.globalRole ?? null;

  if (scope === 'ORG') {
    if (!resource.orgId) return null;
    return actor.orgRoles.get(resource.orgId) ?? null;
  }

  // TEAM scope
  if (!resource.teamId) return null;
  const direct = actor.teamRoles.get(resource.teamId);
  if (direct) return direct;

  // ORG admins/owners get synthetic read-only observer for teams in their org.
  if (resource.orgId) {
    const orgRole = actor.orgRoles.get(resource.orgId);
    if (orgRole === OrgRoleId.ORG_OWNER || orgRole === OrgRoleId.ORG_ADMIN) {
      return SYNTHETIC_ORG_OBSERVER_ROLE_ID;
    }
  }

  return null;
}

export function authorize(
  actor: Actor,
  resource: Resource,
  action: string,
  context: Context
): { allowed: boolean; reason: string } {
  const tenantId = tenantIdFor(resource);

  // 1) Membership gate (status gate always before role/permission checks)
  if (tenantId) {
    const st = actor.membershipStatusByTenant.get(tenantId);
    if (st && isBlockedStatus(st)) {
      return { allowed: false, reason: `membership_blocked:${st}` };
    }
  }

  // 2) Global override
  if (actor.globalRole === PLATFORM_ADMIN_ROLE_ID) {
    return { allowed: true, reason: 'global_override:PLATFORM_ADMIN' };
  }

  // 3) Resolve scope role (with precedence rules)
  const roleId = resolveRoleId(actor, resource);
  if (!roleId) return { allowed: false, reason: 'no_role_for_scope' };

  // 4) Expand permissions with inheritance graph (DFS, deduped)
  const perms = expandPermissions(roleId);

  // 5) RBAC check
  if (!isKnownPermissionId(action)) {
    return { allowed: false, reason: 'unknown_action' };
  }
  const requiredPermission = action;
  if (!perms.has(requiredPermission)) {
    return { allowed: false, reason: `missing_permission:${requiredPermission}` };
  }

  // 6) ABAC checks (context/resource attributes)
  if (requiredPermission === BuiltInPermissionId.MATCH_ATTENDANCE_MANAGE && roleId === TeamRoleId.CAPTAIN) {
    if (context.matchLive !== true) {
      return { allowed: false, reason: 'abac:captain_attendance_requires_matchLive' };
    }
  }

  if (requiredPermission === BuiltInPermissionId.VENUE_EDIT && roleId === OrgRoleId.VENUE_OWNER) {
    if (resource.ownerId && resource.ownerId !== actor.uid) {
      return { allowed: false, reason: 'abac:venue_owner_must_match_resource_owner' };
    }
  }

  if (requiredPermission === BuiltInPermissionId.PAYMENT_APPROVE) {
    if (actor.subscription === 'free') {
      return { allowed: false, reason: 'abac:payment_approve_requires_premium' };
    }
  }

  // 7) Cross-tenant isolation
  const scope = resourceScope(resource);
  if (scope === 'TEAM' && resource.teamId) {
    const isTeamMember = actor.teamRoles.has(resource.teamId);
    const isOrgObserver = roleId === SYNTHETIC_ORG_OBSERVER_ROLE_ID;
    if (!isTeamMember && !isOrgObserver) {
      return { allowed: false, reason: 'tenant_isolation:team_not_in_actor' };
    }
    if (isOrgObserver) {
      if (!resource.orgId) return { allowed: false, reason: 'tenant_isolation:missing_org_for_observer' };
      const orgRole = actor.orgRoles.get(resource.orgId);
      if (!(orgRole === OrgRoleId.ORG_OWNER || orgRole === OrgRoleId.ORG_ADMIN)) {
        return { allowed: false, reason: 'tenant_isolation:observer_requires_org_admin' };
      }
    }
  }
  if (scope === 'ORG' && resource.orgId) {
    if (!actor.orgRoles.has(resource.orgId)) {
      return { allowed: false, reason: 'tenant_isolation:org_not_in_actor' };
    }
  }

  // 8) Allow
  return { allowed: true, reason: `allowed:${requiredPermission}` };
}

