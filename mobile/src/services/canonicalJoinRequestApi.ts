/**
 * Canonical join-request API – join_requests + memberships, Cloud Functions for approve/reject.
 * Production path: list from Firestore, mutate via CF.
 */

import { listPendingJoinRequestsForTeam, type JoinRequestDoc } from './joinRequestService';
import { getUserById } from './firestore';
import { callFunction } from './functions';

export interface CanonicalJoinRequestWithUser extends JoinRequestDoc {
  userName: string;
  userAvatar?: string;
  userPhone?: string;
  userPosition?: string;
}

/**
 * Lists pending join requests for a team and enriches with user display info from users collection.
 */
export async function listJoinRequestsWithUsers(teamId: string): Promise<CanonicalJoinRequestWithUser[]> {
  const list = await listPendingJoinRequestsForTeam(teamId);
  const enriched = await Promise.all(
    list.map(async (jr) => {
      const u = await getUserById(jr.userId);
      return {
        ...jr,
        userName: u?.name ?? 'Oyuncu',
        userAvatar: u?.avatar,
        userPhone: u?.phone,
        userPosition: u?.position,
      };
    })
  );
  return enriched;
}

/**
 * Approves a join request via Cloud Function (production enforcement).
 */
export async function approveJoinRequestViaCF(requestId: string): Promise<void> {
  await callFunction<{ requestId: string }, { ok?: boolean }>('approveJoinRequest', { requestId });
}

/**
 * Rejects a join request via Cloud Function (production enforcement).
 */
export async function rejectJoinRequestViaCF(requestId: string): Promise<void> {
  await callFunction<{ requestId: string }, { ok?: boolean }>('rejectJoinRequest', { requestId });
}
