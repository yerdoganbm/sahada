import type { Permission, PermissionId, Role, RoleId, Scope } from './model';
import { OrgRoleId, TeamRoleId } from './model';

export const PLATFORM_ADMIN_ROLE_ID = 'PLATFORM_ADMIN' as const satisfies RoleId;
export const SYNTHETIC_ORG_OBSERVER_ROLE_ID = 'SYNTHETIC_ORG_OBSERVER' as const satisfies RoleId;

export const BuiltInPermissionId = {
  // Read-only
  TEAM_READ: 'TEAM_READ',
  ORG_READ: 'ORG_READ',
  USER_READ: 'USER_READ',
  MATCH_READ: 'MATCH_READ',
  VENUE_READ: 'VENUE_READ',
  PAYMENT_READ: 'PAYMENT_READ',

  // Team member management
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_APPROVE_JOIN: 'MEMBER_APPROVE_JOIN',
  MEMBER_ROLE_CHANGE: 'MEMBER_ROLE_CHANGE',

  // Team ownership
  TEAM_OWNER_TRANSFER_START: 'TEAM_OWNER_TRANSFER_START',
  TEAM_OWNER_TRANSFER_CONFIRM: 'TEAM_OWNER_TRANSFER_CONFIRM',

  // Matches / attendance
  MATCH_CREATE: 'MATCH_CREATE',
  MATCH_EDIT: 'MATCH_EDIT',
  MATCH_ATTENDANCE_MANAGE: 'MATCH_ATTENDANCE_MANAGE',

  // Payments
  PAYMENT_MARK: 'PAYMENT_MARK',
  PAYMENT_APPROVE: 'PAYMENT_APPROVE',

  // Venues
  VENUE_EDIT: 'VENUE_EDIT',
} as const;

export type BuiltInPermissionId = (typeof BuiltInPermissionId)[keyof typeof BuiltInPermissionId];

export const BUILT_IN_PERMISSIONS: Readonly<Record<PermissionId, Permission>> = {
  [BuiltInPermissionId.TEAM_READ]: {
    id: BuiltInPermissionId.TEAM_READ,
    resourceType: 'team',
    action: 'read',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.ORG_READ]: {
    id: BuiltInPermissionId.ORG_READ,
    resourceType: 'org',
    action: 'read',
    scope: 'ORG',
  },
  [BuiltInPermissionId.USER_READ]: {
    id: BuiltInPermissionId.USER_READ,
    resourceType: 'user',
    action: 'read',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MATCH_READ]: {
    id: BuiltInPermissionId.MATCH_READ,
    resourceType: 'match',
    action: 'read',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.VENUE_READ]: {
    id: BuiltInPermissionId.VENUE_READ,
    resourceType: 'venue',
    action: 'read',
    scope: 'ORG',
  },
  [BuiltInPermissionId.PAYMENT_READ]: {
    id: BuiltInPermissionId.PAYMENT_READ,
    resourceType: 'payment',
    action: 'read',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MEMBER_INVITE]: {
    id: BuiltInPermissionId.MEMBER_INVITE,
    resourceType: 'membership',
    action: 'invite',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MEMBER_APPROVE_JOIN]: {
    id: BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    resourceType: 'membership',
    action: 'approve_join',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MEMBER_ROLE_CHANGE]: {
    id: BuiltInPermissionId.MEMBER_ROLE_CHANGE,
    resourceType: 'membership',
    action: 'role_change',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.TEAM_OWNER_TRANSFER_START]: {
    id: BuiltInPermissionId.TEAM_OWNER_TRANSFER_START,
    resourceType: 'team',
    action: 'owner_transfer_start',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM]: {
    id: BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM,
    resourceType: 'team',
    action: 'owner_transfer_confirm',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MATCH_CREATE]: {
    id: BuiltInPermissionId.MATCH_CREATE,
    resourceType: 'match',
    action: 'create',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MATCH_EDIT]: {
    id: BuiltInPermissionId.MATCH_EDIT,
    resourceType: 'match',
    action: 'edit',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.MATCH_ATTENDANCE_MANAGE]: {
    id: BuiltInPermissionId.MATCH_ATTENDANCE_MANAGE,
    resourceType: 'match',
    action: 'attendance_manage',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.PAYMENT_MARK]: {
    id: BuiltInPermissionId.PAYMENT_MARK,
    resourceType: 'payment',
    action: 'mark',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.PAYMENT_APPROVE]: {
    id: BuiltInPermissionId.PAYMENT_APPROVE,
    resourceType: 'payment',
    action: 'approve',
    scope: 'TEAM',
  },
  [BuiltInPermissionId.VENUE_EDIT]: {
    id: BuiltInPermissionId.VENUE_EDIT,
    resourceType: 'venue',
    action: 'edit',
    scope: 'ORG',
  },
};

function role(id: RoleId, scope: Scope, permissions: PermissionId[], inheritance: RoleId[] = []): Role {
  return {
    id,
    scope,
    permissions,
    inheritance,
    isCustom: false,
  };
}

/**
 * Built-in role hierarchy (TEAM):
 * TEAM_OWNER inherits TEAM_ADMIN inherits CAPTAIN inherits MEMBER inherits GUEST
 */
export const BUILT_IN_ROLES: Readonly<Record<RoleId, Role>> = {
  [TeamRoleId.GUEST]: role(TeamRoleId.GUEST, 'TEAM', [
    BuiltInPermissionId.TEAM_READ,
    BuiltInPermissionId.MATCH_READ,
    BuiltInPermissionId.PAYMENT_READ,
  ]),
  [TeamRoleId.MEMBER]: role(TeamRoleId.MEMBER, 'TEAM', [
    BuiltInPermissionId.USER_READ,
    BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM,
  ], [TeamRoleId.GUEST]),
  [TeamRoleId.CAPTAIN]: role(TeamRoleId.CAPTAIN, 'TEAM', [
    BuiltInPermissionId.MATCH_CREATE,
    BuiltInPermissionId.MATCH_EDIT,
    BuiltInPermissionId.MATCH_ATTENDANCE_MANAGE,
  ], [TeamRoleId.MEMBER]),
  [TeamRoleId.TEAM_ADMIN]: role(TeamRoleId.TEAM_ADMIN, 'TEAM', [
    BuiltInPermissionId.MEMBER_INVITE,
    BuiltInPermissionId.MEMBER_APPROVE_JOIN,
    BuiltInPermissionId.MEMBER_ROLE_CHANGE,
    BuiltInPermissionId.TEAM_OWNER_TRANSFER_START,
    BuiltInPermissionId.PAYMENT_MARK,
    BuiltInPermissionId.PAYMENT_APPROVE,
  ], [TeamRoleId.CAPTAIN]),
  [TeamRoleId.TEAM_OWNER]: role(TeamRoleId.TEAM_OWNER, 'TEAM', [], [TeamRoleId.TEAM_ADMIN]),

  /**
   * Synthetic role: ORG_OWNER/ORG_ADMIN read-only observer for teams in their org.
   * Must not grant any mutation permissions.
   */
  [SYNTHETIC_ORG_OBSERVER_ROLE_ID]: role(SYNTHETIC_ORG_OBSERVER_ROLE_ID, 'TEAM', [
    BuiltInPermissionId.TEAM_READ,
    BuiltInPermissionId.MATCH_READ,
    BuiltInPermissionId.USER_READ,
    BuiltInPermissionId.PAYMENT_READ,
  ]),

  // ORG roles
  [OrgRoleId.VENUE_OWNER]: role(OrgRoleId.VENUE_OWNER, 'ORG', [
    BuiltInPermissionId.ORG_READ,
    BuiltInPermissionId.VENUE_READ,
    BuiltInPermissionId.VENUE_EDIT,
  ]),
  [OrgRoleId.STAFF]: role(OrgRoleId.STAFF, 'ORG', [
    BuiltInPermissionId.ORG_READ,
    BuiltInPermissionId.VENUE_READ,
  ]),
  [OrgRoleId.ORG_ADMIN]: role(OrgRoleId.ORG_ADMIN, 'ORG', [
    BuiltInPermissionId.ORG_READ,
    BuiltInPermissionId.VENUE_READ,
  ], [OrgRoleId.STAFF]),
  [OrgRoleId.ORG_OWNER]: role(OrgRoleId.ORG_OWNER, 'ORG', [], [OrgRoleId.ORG_ADMIN]),

  // GLOBAL role
  [PLATFORM_ADMIN_ROLE_ID]: role(PLATFORM_ADMIN_ROLE_ID, 'GLOBAL', []),
};

export function getBuiltInRole(roleId: RoleId): Role | null {
  return BUILT_IN_ROLES[roleId] ?? null;
}

export function isKnownPermissionId(permissionId: string): permissionId is PermissionId {
  return permissionId in BUILT_IN_PERMISSIONS;
}

/**
 * Expand permissions for a role by traversing inheritance (DFS, deduped).
 * Unknown roles expand to an empty set (default deny).
 */
export function expandPermissions(roleId: RoleId): Set<PermissionId> {
  const visited = new Set<RoleId>();
  const perms = new Set<PermissionId>();

  const stack: RoleId[] = [roleId];
  while (stack.length) {
    const rid = stack.pop()!;
    if (visited.has(rid)) continue;
    visited.add(rid);

    const r = getBuiltInRole(rid);
    if (!r) continue;

    for (const p of r.permissions) perms.add(p);
    for (const parent of r.inheritance) stack.push(parent);
  }

  return perms;
}

