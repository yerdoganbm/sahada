import firestore from '@react-native-firebase/firestore';
import type { Player } from '../types';
import { getUserById } from './firestore';

export interface TeamMember extends Player {
  roleId: string;
  membershipId: string;
}

export async function listActiveTeamMembers(teamId: string): Promise<TeamMember[]> {
  const snap = await firestore()
    .collection('memberships')
    .where('teamId', '==', teamId)
    .where('status', '==', 'ACTIVE')
    .limit(200)
    .get();

  const memberships = snap.docs.map((d) => {
    const data = (d.data() || {}) as Record<string, unknown>;
    return {
      membershipId: d.id,
      userId: (data.userId as string) ?? '',
      roleId: (data.roleId as string) ?? 'MEMBER',
    };
  }).filter((m) => !!m.userId);

  const users = await Promise.all(memberships.map(async (m) => [m.userId, await getUserById(m.userId)] as const));
  const map = new Map(users.filter(([, u]) => !!u) as Array<[string, Player]>);

  return memberships
    .map((m) => {
      const u = map.get(m.userId);
      if (!u) return null;
      return { ...u, roleId: m.roleId, membershipId: m.membershipId } satisfies TeamMember;
    })
    .filter(Boolean) as TeamMember[];
}

