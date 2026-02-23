export type Scope = 'TEAM' | 'ORG' | 'GLOBAL';

export type TeamId = string;
export type OrgId = string;
export type TenantId = string;
export type UserId = string;
export type ResourceId = string;

export type RoleId = string;
export type PermissionId = string;

export interface Role {
  id: RoleId;
  scope: Scope;
  permissions: PermissionId[];
  inheritance: RoleId[];
  isCustom: boolean;
  /**
   * For custom roles, the owning tenant identifier (teamId/orgId), if applicable.
   * Built-in roles may omit this.
   */
  tenantId?: TenantId;
}

export interface Permission {
  id: PermissionId;
  resourceType: string;
  action: string;
  scope: Scope;
}

export type SubscriptionTier = 'free' | 'premium' | 'partner';

export interface Actor {
  uid: UserId;
  teamRoles: Map<TeamId, RoleId>;
  orgRoles: Map<OrgId, RoleId>;
  globalRole?: RoleId;
  membershipStatusByTenant: Map<TenantId, MembershipStatus>;
  subscription: SubscriptionTier;
}

export interface Resource {
  type: string;
  id: ResourceId;
  teamId?: TeamId;
  orgId?: OrgId;
  ownerId?: UserId;
}

export interface Context {
  time: Date;
  matchState?: string;
  requestIp?: string;
  sessionToken?: string;
  matchLive?: boolean;
  flags: Record<string, boolean>;
}

export const MembershipStatus = {
  INVITED: 'INVITED',
  INVITE_EXPIRED: 'INVITE_EXPIRED',
  REQUESTED: 'REQUESTED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  TEMP_BANNED: 'TEMP_BANNED',
  LEFT: 'LEFT',
  TRANSFERRED: 'TRANSFERRED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const TeamRoleId = {
  TEAM_OWNER: 'TEAM_OWNER',
  TEAM_ADMIN: 'TEAM_ADMIN',
  CAPTAIN: 'CAPTAIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const;
export type TeamRoleId = (typeof TeamRoleId)[keyof typeof TeamRoleId];

export const OrgRoleId = {
  ORG_OWNER: 'ORG_OWNER',
  ORG_ADMIN: 'ORG_ADMIN',
  STAFF: 'STAFF',
  VENUE_OWNER: 'VENUE_OWNER',
} as const;
export type OrgRoleId = (typeof OrgRoleId)[keyof typeof OrgRoleId];

const BLOCKED_STATUSES = new Set<MembershipStatus>([
  MembershipStatus.SUSPENDED,
  MembershipStatus.BANNED,
  MembershipStatus.TEMP_BANNED,
]);

// Terminal = membership cannot be re-activated without an explicit re-provisioning flow.
const TERMINAL_STATUSES = new Set<MembershipStatus>([
  MembershipStatus.BANNED,
  MembershipStatus.TRANSFERRED,
]);

export function isTerminalStatus(status: MembershipStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isBlockedStatus(status: MembershipStatus): boolean {
  return BLOCKED_STATUSES.has(status);
}

