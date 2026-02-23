import admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  windowSeconds: number;
};

function floorToBucketStartMs(nowMs: number, windowSeconds: number): number {
  const winMs = windowSeconds * 1000;
  return Math.floor(nowMs / winMs) * winMs;
}

function docIdFor(key: string, bucketStartMs: number): string {
  // Keep doc ids deterministic and queryable. Avoid slashes.
  return `${key}__${bucketStartMs}`;
}

function readCount(snap: admin.firestore.DocumentSnapshot): number {
  const d = (snap.data() || {}) as Record<string, unknown>;
  const c = d.count;
  return typeof c === 'number' && Number.isFinite(c) ? c : 0;
}

/**
 * Sliding window rate limit using two fixed buckets (current + previous).
 *
 * Approximation:
 *   effective = currentCount + prevCount * (1 - elapsed/window)
 *
 * Storage:
 * - `rate_limits/{key}__{bucketStartMs}` with fields: { key, bucketStartMs, count, windowSeconds, expiresAt }
 */
export async function enforceRateLimit(args: {
  key: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
  meta?: Record<string, unknown>;
}): Promise<RateLimitDecision> {
  const { key, limit, windowSeconds, meta } = args;
  const now = args.now ?? new Date();
  if (!key || typeof key !== 'string') throw new HttpsError('invalid-argument', 'rate_limit_key_required');
  if (!Number.isFinite(limit) || limit <= 0) throw new HttpsError('invalid-argument', 'rate_limit_limit_invalid');
  if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
    throw new HttpsError('invalid-argument', 'rate_limit_window_invalid');
  }

  const db = admin.firestore();
  const nowMs = now.getTime();
  const bucketStartMs = floorToBucketStartMs(nowMs, windowSeconds);
  const prevBucketStartMs = bucketStartMs - windowSeconds * 1000;
  const elapsedMs = nowMs - bucketStartMs;
  const weightPrev = 1 - elapsedMs / (windowSeconds * 1000);

  const currentRef = db.collection('rate_limits').doc(docIdFor(key, bucketStartMs));
  const prevRef = db.collection('rate_limits').doc(docIdFor(key, prevBucketStartMs));

  const finalDecision = await db.runTransaction(async (tx): Promise<RateLimitDecision> => {
    const [curSnap, prevSnap] = await Promise.all([tx.get(currentRef), tx.get(prevRef)]);
    const curCount = readCount(curSnap);
    const prevCount = readCount(prevSnap);

    const effective = curCount + prevCount * Math.max(0, Math.min(1, weightPrev));
    const nextEffective = effective + 1;

    const allowed = nextEffective <= limit;
    const remaining = Math.max(0, Math.floor(limit - nextEffective));
    const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((windowSeconds * 1000 - elapsedMs) / 1000));

    if (!allowed) {
      return { allowed: false, remaining, retryAfterSeconds, limit, windowSeconds };
    }

    // Increment current bucket
    const expiresAt = admin.firestore.Timestamp.fromMillis(bucketStartMs + 2 * windowSeconds * 1000);
    if (!curSnap.exists) {
      tx.set(currentRef, {
        key,
        bucketStartMs,
        windowSeconds,
        count: 1,
        expiresAt,
        ...(meta ? { meta } : {}),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(currentRef, {
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { allowed: true, remaining, retryAfterSeconds: 0, limit, windowSeconds };
  });

  if (!finalDecision.allowed) {
    // resource-exhausted is the standard quota/rate error in callable functions.
    throw new HttpsError('resource-exhausted', 'rate_limited', {
      key,
      limit: finalDecision.limit,
      windowSeconds: finalDecision.windowSeconds,
      retryAfterSeconds: finalDecision.retryAfterSeconds,
    });
  }
  return finalDecision;
}

