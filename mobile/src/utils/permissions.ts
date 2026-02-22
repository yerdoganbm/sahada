/**
 * Yetki yönetimi - admin maksimum yetki, kaptan maç/kadro yönetimi
 */

import type { Player } from '../types';

/** Admin: tüm yetkiler maks seviyede */
export function hasFullAdmin(user: Player | null | undefined): boolean {
  return user?.role === 'admin';
}

/** Maç oluşturma: admin veya kaptan */
export function canCreateMatch(user: Player | null | undefined): boolean {
  return user?.role === 'admin' || user?.isCaptain === true;
}

/** Üye / kadro yönetimi: admin veya kaptan */
export function canManageMembers(user: Player | null | undefined): boolean {
  return user?.role === 'admin' || user?.isCaptain === true;
}

/** Yönetim paneli: sadece admin */
export function canAccessAdminPanel(user: Player | null | undefined): boolean {
  return user?.role === 'admin';
}
