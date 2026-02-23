import { callFunction } from './functions';

export async function changeMemberRole(args: {
  teamId: string;
  userId: string;
  roleId: string;
}): Promise<void> {
  const { teamId, userId, roleId } = args;
  await callFunction('changeMemberRole', { teamId, userId, roleId });
}

