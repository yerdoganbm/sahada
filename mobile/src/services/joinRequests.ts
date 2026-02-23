/**
 * Katılım istekleri – LEGACY (player_join_requests).
 * @deprecated Use canonicalJoinRequestApi (join_requests + Cloud Functions) for production.
 * MemberManagementScreen uses canonicalJoinRequestApi. This module remains for backward compatibility only.
 */

import {
  getJoinRequests as getJoinRequestsFromFirestore,
  approveJoinRequest as approveJoinRequestInFirestore,
  rejectJoinRequest as rejectJoinRequestInFirestore,
  createJoinRequest as createJoinRequestInFirestore,
  type JoinRequestItem,
} from './firestore';

export type { JoinRequestItem };

export async function createJoinRequest(data: {
  teamId: string;
  name: string;
  phone: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  referrerId?: string;
}): Promise<JoinRequestItem> {
  return createJoinRequestInFirestore(data);
}

export async function getJoinRequests(teamId: string): Promise<JoinRequestItem[]> {
  try {
    return await getJoinRequestsFromFirestore(teamId);
  } catch (e) {
    console.warn('getJoinRequests failed', e);
    return [];
  }
}

export async function approveJoinRequest(requestId: string): Promise<void> {
  await approveJoinRequestInFirestore(requestId);
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  await rejectJoinRequestInFirestore(requestId);
}
