import type { Actor, MembershipStatus, OrgId, RoleId, TeamId, TenantId, UserId } from './model';
import { MembershipStatus as MS, isBlockedStatus } from './model';

export class MembershipTransitionError extends Error {
  readonly code:
    | 'INVALID_TRANSITION'
    | 'COOLDOWN_ACTIVE'
    | 'TEMP_BAN_NOT_EXPIRED'
    | 'MISSING_METADATA';

  constructor(
    code: MembershipTransitionError['code'],
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MembershipTransitionError';
    this.code = code;
  }
}

export const COOLDOWN_MS = {
  LEFT_TO_REQUESTED: 72 * 60 * 60 * 1000,
  REJECTED_TO_REQUESTED: 24 * 60 * 60 * 1000,
} as const;

const TRANSITION_MATRIX_ARRAYS: Record<MembershipStatus, readonly MembershipStatus[]> = {
  [MS.INVITED]: [MS.ACTIVE, MS.INVITE_EXPIRED, MS.LEFT],
  [MS.INVITE_EXPIRED]: [MS.INVITED, MS.REQUESTED],
  [MS.REQUESTED]: [MS.ACTIVE, MS.REQUEST_REJECTED, MS.INVITED],
  [MS.REQUEST_REJECTED]: [MS.REQUESTED, MS.INVITED],
  [MS.ACTIVE]: [MS.SUSPENDED, MS.BANNED, MS.TEMP_BANNED, MS.LEFT, MS.TRANSFERRED],
  [MS.SUSPENDED]: [MS.ACTIVE, MS.BANNED, MS.TEMP_BANNED],
  [MS.TEMP_BANNED]: [MS.ACTIVE, MS.BANNED, MS.SUSPENDED],
  [MS.BANNED]: [],
  [MS.LEFT]: [MS.REQUESTED, MS.INVITED],
  [MS.TRANSFERRED]: [],
};

function toSetRecord<T extends string>(
  record: Record<T, readonly T[]>
): Record<T, ReadonlySet<T>> {
  const out = {} as Record<T, ReadonlySet<T>>;
  for (const k of Object.keys(record) as T[]) {
    out[k] = new Set(record[k]);
  }
  return out;
}

export const TRANSITION_MATRIX = toSetRecord(TRANSITION_MATRIX_ARRAYS);

export interface TransitionMeta {
  /**
   * Current wall clock time at decision point.
   * Caller must set this (server-side for privileged transitions).
   */
  now: Date;

  /**
   * When the membership entered LEFT (for cooldown enforcement).
   */
  leftAt?: Date;

  /**
   * When the membership entered REQUEST_REJECTED (for cooldown enforcement).
   */
  rejectedAt?: Date;

  /**
   * TEMP_BANNED end timestamp (required for TEMP_BANNED -> ACTIVE).
   */
  banEnd?: Date;

  /**
   * True only when an authorized admin explicitly overrides TEMP_BANNED expiry.
   * (Authz gate must be checked before this is set true.)
   */
  adminOverride?: boolean;
}

export function validateTransition(args: {
  current: MembershipStatus;
  next: MembershipStatus;
  actor: Actor;
  meta: TransitionMeta;
}): { ok: true } {
  const { current, next, meta } = args;

  // Idempotency-friendly: repeated attempts should not be rejected solely for being a no-op.
  if (current === next) return { ok: true };

  const allowed = TRANSITION_MATRIX[current];
  if (!allowed?.has(next)) {
    throw new MembershipTransitionError(
      'INVALID_TRANSITION',
      `Invalid membership transition: ${current} -> ${next}`,
      { current, next }
    );
  }

  if (current === MS.LEFT && next === MS.REQUESTED) {
    if (!meta.leftAt) {
      throw new MembershipTransitionError(
        'MISSING_METADATA',
        'leftAt is required to validate LEFT -> REQUESTED cooldown',
        { current, next }
      );
    }
    const elapsed = meta.now.getTime() - meta.leftAt.getTime();
    if (elapsed < COOLDOWN_MS.LEFT_TO_REQUESTED) {
      throw new MembershipTransitionError(
        'COOLDOWN_ACTIVE',
        'Cooldown active for LEFT -> REQUESTED',
        { cooldownMs: COOLDOWN_MS.LEFT_TO_REQUESTED, elapsedMs: elapsed }
      );
    }
  }

  if (current === MS.REQUEST_REJECTED && next === MS.REQUESTED) {
    if (!meta.rejectedAt) {
      throw new MembershipTransitionError(
        'MISSING_METADATA',
        'rejectedAt is required to validate REQUEST_REJECTED -> REQUESTED cooldown',
        { current, next }
      );
    }
    const elapsed = meta.now.getTime() - meta.rejectedAt.getTime();
    if (elapsed < COOLDOWN_MS.REJECTED_TO_REQUESTED) {
      throw new MembershipTransitionError(
        'COOLDOWN_ACTIVE',
        'Cooldown active for REQUEST_REJECTED -> REQUESTED',
        { cooldownMs: COOLDOWN_MS.REJECTED_TO_REQUESTED, elapsedMs: elapsed }
      );
    }
  }

  if (current === MS.TEMP_BANNED && next === MS.ACTIVE) {
    if (!meta.banEnd) {
      throw new MembershipTransitionError(
        'MISSING_METADATA',
        'banEnd is required to validate TEMP_BANNED -> ACTIVE',
        { current, next }
      );
    }
    const isExpired = meta.banEnd.getTime() <= meta.now.getTime();
    if (!isExpired && meta.adminOverride !== true) {
      throw new MembershipTransitionError(
        'TEMP_BAN_NOT_EXPIRED',
        'TEMP_BANNED cannot transition to ACTIVE before banEnd unless adminOverride is true',
        { banEnd: meta.banEnd.toISOString(), now: meta.now.toISOString() }
      );
    }
  }

  return { ok: true };
}

export interface MembershipDocument {
  tenantId: TenantId;
  teamId?: TeamId;
  orgId?: OrgId;
  userId: UserId;
  roleId: RoleId;
  status: MembershipStatus;
  version: number;
  bannedRoleSnapshot?: RoleId;
  leftAt?: Date;
  rejectedAt?: Date;
  banEnd?: Date;
}

export interface MembershipTransitionUpdate {
  status: MembershipStatus;
  version: number;
  previousStatus: MembershipStatus;
  updatedAt: Date;
  updatedBy: UserId;
  roleId?: RoleId;
  bannedRoleSnapshot?: RoleId;
  leftAt?: Date;
  rejectedAt?: Date;
  banEnd?: Date;
}

export interface MembershipAuditRecord {
  action: 'MEMBERSHIP_STATUS_TRANSITION';
  at: Date;
  actorId: UserId;
  subjectUserId: UserId;
  tenantId: TenantId;
  teamId?: TeamId;
  orgId?: OrgId;
  from: MembershipStatus;
  to: MembershipStatus;
  membershipVersion: number;
  meta?: Record<string, unknown>;
}

export const NONE_ROLE_ID = 'NONE' as const satisfies RoleId;

export function nextMembershipVersion(currentVersion: number, didChange: boolean): number {
  const base = Number.isFinite(currentVersion) ? Math.trunc(currentVersion) : 0;
  if (base < 0) {
    throw new MembershipTransitionError(
      'MISSING_METADATA',
      'membership.version must be a non-negative integer',
      { currentVersion }
    );
  }
  return didChange ? base + 1 : base;
}

export function planMembershipTransition(args: {
  membership: MembershipDocument;
  nextStatus: MembershipStatus;
  actor: Actor;
  meta: TransitionMeta & { auditMeta?: Record<string, unknown> };
}): { update: MembershipTransitionUpdate | null; audit: MembershipAuditRecord | null } {
  const { membership, nextStatus, actor, meta } = args;

  validateTransition({
    current: membership.status,
    next: nextStatus,
    actor,
    meta,
  });

  const didChange = membership.status !== nextStatus;
  const nextVersion = nextMembershipVersion(membership.version, didChange);

  if (!didChange) {
    return { update: null, audit: null };
  }

  const update: MembershipTransitionUpdate = {
    status: nextStatus,
    version: nextVersion,
    previousStatus: membership.status,
    updatedAt: meta.now,
    updatedBy: actor.uid,
  };

  if (nextStatus === MS.LEFT) update.leftAt = meta.now;
  if (nextStatus === MS.REQUEST_REJECTED) update.rejectedAt = meta.now;
  if (nextStatus === MS.TEMP_BANNED) {
    if (!meta.banEnd) {
      throw new MembershipTransitionError(
        'MISSING_METADATA',
        'banEnd is required when transitioning to TEMP_BANNED',
        { nextStatus }
      );
    }
    update.banEnd = meta.banEnd;
  }

  // Role resurrection prevention: snapshot on any blocked status, and force live role to NONE.
  if (isBlockedStatus(nextStatus)) {
    const liveRole = membership.roleId;
    const snapshot = membership.bannedRoleSnapshot ?? (liveRole !== NONE_ROLE_ID ? liveRole : undefined);
    if (snapshot) update.bannedRoleSnapshot = snapshot;
    if (liveRole !== NONE_ROLE_ID) update.roleId = NONE_ROLE_ID;
  }

  const audit: MembershipAuditRecord = {
    action: 'MEMBERSHIP_STATUS_TRANSITION',
    at: meta.now,
    actorId: actor.uid,
    subjectUserId: membership.userId,
    tenantId: membership.tenantId,
    teamId: membership.teamId,
    orgId: membership.orgId,
    from: membership.status,
    to: nextStatus,
    membershipVersion: nextVersion,
    meta: meta.auditMeta,
  };

  return { update, audit };
}

