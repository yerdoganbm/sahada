import type { Actor, MembershipStatus } from './model';
import { MembershipStatus as MS } from './model';

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

