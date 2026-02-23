import { authorize } from '../authorize';
import type { Actor, Context, Resource } from '../model';
import { MembershipStatus, TeamRoleId } from '../model';
import { BuiltInPermissionId } from '../roleRegistry';

function baseContext(overrides?: Partial<Context>): Context {
  return {
    time: new Date(),
    matchLive: false,
    flags: {},
    ...overrides,
  };
}

describe('authorize()', () => {
  test('denies when membership is blocked (status gate)', () => {
    const actor: Actor = {
      uid: 'u1',
      teamRoles: new Map([['t1', TeamRoleId.TEAM_ADMIN]]),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map([['t1', MembershipStatus.BANNED]]),
      subscription: 'premium',
    };
    const resource: Resource = { type: 'team', id: 't1', teamId: 't1' };

    const res = authorize(actor, resource, BuiltInPermissionId.TEAM_READ, baseContext());
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('membership_blocked');
  });

  test('allows TEAM_ADMIN to invite', () => {
    const actor: Actor = {
      uid: 'admin1',
      teamRoles: new Map([['t1', TeamRoleId.TEAM_ADMIN]]),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map([['t1', MembershipStatus.ACTIVE]]),
      subscription: 'premium',
    };
    const resource: Resource = { type: 'membership', id: 't1', teamId: 't1' };

    const res = authorize(actor, resource, BuiltInPermissionId.MEMBER_INVITE, baseContext());
    expect(res.allowed).toBe(true);
  });

  test('denies unknown permission ids', () => {
    const actor: Actor = {
      uid: 'admin1',
      teamRoles: new Map([['t1', TeamRoleId.TEAM_ADMIN]]),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map([['t1', MembershipStatus.ACTIVE]]),
      subscription: 'premium',
    };
    const resource: Resource = { type: 'team', id: 't1', teamId: 't1' };

    const res = authorize(actor, resource, 'SOME_UNKNOWN_PERMISSION', baseContext());
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('unknown_action');
  });

  test('owner transfer start requires current owner (ABAC)', () => {
    const actor: Actor = {
      uid: 'admin1',
      teamRoles: new Map([['t1', TeamRoleId.TEAM_ADMIN]]),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map([['t1', MembershipStatus.ACTIVE]]),
      subscription: 'premium',
    };
    const resource: Resource = { type: 'team', id: 't1', teamId: 't1', ownerId: 'someone_else' };

    const res = authorize(actor, resource, BuiltInPermissionId.TEAM_OWNER_TRANSFER_START, baseContext());
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('owner_transfer_start_requires_current_owner');
  });

  test('owner transfer confirm requires target (ABAC)', () => {
    const actor: Actor = {
      uid: 'member1',
      teamRoles: new Map([['t1', TeamRoleId.MEMBER]]),
      orgRoles: new Map(),
      membershipStatusByTenant: new Map([['t1', MembershipStatus.ACTIVE]]),
      subscription: 'free',
    };
    const resource: Resource = { type: 'team', id: 't1', teamId: 't1', ownerId: 'member1' };

    const res = authorize(actor, resource, BuiltInPermissionId.TEAM_OWNER_TRANSFER_CONFIRM, baseContext());
    expect(res.allowed).toBe(true);
  });
});

