import { expandPermissions, BuiltInPermissionId } from '../roleRegistry';
import { TeamRoleId } from '../model';

describe('roleRegistry.expandPermissions', () => {
  test('TEAM_ADMIN inherits CAPTAIN->MEMBER->GUEST permissions', () => {
    const perms = expandPermissions(TeamRoleId.TEAM_ADMIN);
    expect(perms.has(BuiltInPermissionId.MEMBER_INVITE)).toBe(true);
    expect(perms.has(BuiltInPermissionId.MATCH_CREATE)).toBe(true);
    expect(perms.has(BuiltInPermissionId.USER_READ)).toBe(true);
    expect(perms.has(BuiltInPermissionId.TEAM_READ)).toBe(true);
  });

  test('CAPTAIN does not get admin-only member invite', () => {
    const perms = expandPermissions(TeamRoleId.CAPTAIN);
    expect(perms.has(BuiltInPermissionId.MEMBER_INVITE)).toBe(false);
    expect(perms.has(BuiltInPermissionId.MATCH_ATTENDANCE_MANAGE)).toBe(true);
  });
});

