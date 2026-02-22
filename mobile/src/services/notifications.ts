/**
 * Bildirimler – Firestore ile
 */

import {
  getNotifications as getNotificationsFromFirestore,
  type NotificationItem,
} from './firestore';

export type { NotificationItem };

export async function getNotifications(
  userId?: string,
  teamId?: string
): Promise<NotificationItem[]> {
  try {
    return await getNotificationsFromFirestore(userId, teamId);
  } catch (e) {
    console.warn('getNotifications failed', e);
    return [];
  }
}
