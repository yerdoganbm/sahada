import { HttpsError } from 'firebase-functions/v2/https';

export function requireAuth(ctx: { auth?: { uid: string } | null }): string {
  const uid = ctx?.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required');
  return uid;
}

export function permissionDenied(message: string): HttpsError {
  return new HttpsError('permission-denied', message);
}

export function invalidArg(message: string): HttpsError {
  return new HttpsError('invalid-argument', message);
}

