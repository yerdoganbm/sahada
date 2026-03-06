/**
 * Feature Flags — tüm özellikler buradan açılır/kapatılır.
 * localStorage üzerinden override edilebilir (debug panel).
 */

export interface FeatureFlags {
  PRO_SLOT: boolean;
  PRO_PAYMENTS: boolean;
  CAPTAIN_WALLET: boolean;
  MEMBER_JOIN: boolean;
  OWNER_BUSINESS_PACK: boolean;
  LOCATION_PRO: boolean;
  WAITLIST: boolean;
  ALT_OFFER: boolean;
  ANALYTICS: boolean;
  AUDIT: boolean;
  OUTBOX: boolean;
  CSV_EXPORT: boolean;
  RECURRING: boolean;
  CHECKIN: boolean;
  MAINTENANCE: boolean;
}

const DEFAULTS: FeatureFlags = {
  PRO_SLOT: true,
  PRO_PAYMENTS: true,
  CAPTAIN_WALLET: true,
  MEMBER_JOIN: true,
  OWNER_BUSINESS_PACK: true,
  LOCATION_PRO: true,
  WAITLIST: true,
  ALT_OFFER: true,
  ANALYTICS: true,
  AUDIT: true,
  OUTBOX: true,
  CSV_EXPORT: true,
  RECURRING: true,
  CHECKIN: true,
  MAINTENANCE: true,
};

function loadFromStorage(): Partial<FeatureFlags> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('sahada_flags') : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildFlags(): FeatureFlags {
  const overrides = loadFromStorage();
  return { ...DEFAULTS, ...overrides } as FeatureFlags;
}

/** Live flags — use this throughout the app */
export const FLAGS: FeatureFlags = buildFlags();

/** Toggle a flag at runtime (persists to localStorage, reload to apply) */
export function toggleFlag(key: keyof FeatureFlags, value: boolean): void {
  try {
    const current = loadFromStorage();
    current[key] = value;
    localStorage.setItem('sahada_flags', JSON.stringify(current));
  } catch {}
}

/** Reset all overrides to defaults */
export function resetFlags(): void {
  try {
    localStorage.removeItem('sahada_flags');
  } catch {}
}
