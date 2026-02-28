/**
 * Yetki yönetimi
 * - Owner (role=admin): Uygulamayı kuran, en üst kademe → tüm yetkiler
 * - Admin (takımı kuran): isCaptain / takım kurucusu → Yönetim, maç, üye yönetimi (takım kapsamında)
 */

import type { Player } from '../types';

/** Owner: uygulamayı kuran, yöneten, en üst kademe (role=admin) */
export function isAppOwner(user: Player | null | undefined): boolean {
  return user?.role === 'admin';
}

/** Takımı kuran / takım yöneticisi (kaptan) */
function isTeamAdmin(user: Player | null | undefined): boolean {
  return user?.isCaptain === true;
}

/** Owner: tüm yetkiler maks seviyede, sadece uygulama sahibi */
export function hasFullAdmin(user: Player | null | undefined): boolean {
  return isAppOwner(user);
}

/** Maç oluşturma: owner veya takımı kuran (kaptan) */
export function canCreateMatch(user: Player | null | undefined): boolean {
  return isAppOwner(user) || isTeamAdmin(user);
}

/** Üye / kadro yönetimi: owner veya takımı kuran (kaptan) */
export function canManageMembers(user: Player | null | undefined): boolean {
  return isAppOwner(user) || isTeamAdmin(user);
}

/** Yönetim paneli: owner veya takımı kuran (admin) */
export function canAccessAdminPanel(user: Player | null | undefined): boolean {
  return isAppOwner(user) || isTeamAdmin(user);
}
