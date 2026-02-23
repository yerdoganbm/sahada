import { canAssignTeamRole } from '../roleHierarchy';
import { TeamRoleId } from '../model';

describe('roleHierarchy.canAssignTeamRole', () => {
  test('denies assigning TEAM_OWNER via role change', () => {
    const r = canAssignTeamRole({
      actorRoleId: TeamRoleId.TEAM_OWNER,
      desiredRoleId: TeamRoleId.TEAM_OWNER,
    });
    expect(r.ok).toBe(false);
  });

  test('denies assigning higher role than actor', () => {
    const r = canAssignTeamRole({
      actorRoleId: TeamRoleId.CAPTAIN,
      desiredRoleId: TeamRoleId.TEAM_ADMIN,
    });
    expect(r.ok).toBe(false);
  });

  test('allows admin to assign captain', () => {
    const r = canAssignTeamRole({
      actorRoleId: TeamRoleId.TEAM_ADMIN,
      desiredRoleId: TeamRoleId.CAPTAIN,
    });
    expect(r.ok).toBe(true);
  });
});

