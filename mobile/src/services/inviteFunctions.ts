import { callFunction } from './functions';

function inferTargetType(value: string): 'PHONE' | 'EMAIL' {
  return value.includes('@') ? 'EMAIL' : 'PHONE';
}

export async function createInviteToken(args: {
  teamId: string;
  targetValue: string;
  roleId: string;
  ttlHours?: number;
}): Promise<{ inviteId: string; token: string; expiresAt: string }> {
  const targetValue = args.targetValue.trim();
  if (!targetValue) throw new Error('Hedef (telefon/email) gerekli');
  const target = { type: inferTargetType(targetValue), value: targetValue } as const;
  return await callFunction('createInvite', {
    teamId: args.teamId,
    target,
    roleId: args.roleId,
    ttlHours: args.ttlHours,
  });
}

export async function acceptInviteToken(token: string): Promise<{ ok: true; teamId: string; roleId: string }> {
  return await callFunction('acceptInvite', { token });
}

