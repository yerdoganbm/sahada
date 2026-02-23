import { sha256 } from 'js-sha256';

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

export function sha256Hex(input: string): string {
  return sha256(input);
}

/**
 * Generate a one-time invite token.
 *
 * Security note: in production this should be generated server-side using a
 * cryptographically secure RNG and delivered to the target out-of-band.
 */
export function generateInviteTokenHex(bytesLen = 20): string {
  const bytes = new Uint8Array(bytesLen);
  const cryptoObj = (globalThis as any)?.crypto as { getRandomValues?: (a: Uint8Array) => Uint8Array } | undefined;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
    return bytesToHex(bytes);
  }
  // Fallback (not cryptographically secure): keep UX working in environments without WebCrypto.
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytesToHex(bytes);
}

