# Rate Limits (Design)

Rate limiting must be enforced **server-side** (Cloud Functions) and only mirrored on the client for UX.

## Keys and windows (spec)

- `teamCreate/day` (per actor)
- `invite/hour` (per team)
- `joinRequest/hour` (per user)
- `matchCreate/day` (per team or per actor)
- `paymentMark/min` (per admin)

## Algorithm

- Sliding window counter stored in Firestore (two-bucket approximation):
  - `rate_limits/{id}` where `id = "${key}__${bucketStartMs}"`
  - Effective count is approximated using current + previous bucket (weighted).
- For high write rates, use **sharded counters**:
  - `rate_limits/{key}/shards/{n}` incremented by random shard id

## Enforcement flow (Cloud Function)

- Compute rate-limit key for the request
- Transactionally:
  - read current window counter(s)
  - reject if limit exceeded
  - increment counter and proceed with the privileged mutation
- Write an audit record for allow/deny

## Repo implementation

- `functions/src/rateLimit.ts` implements the sliding-window limiter.
- Integrated into callables in `functions/src/index.ts`:
  - `createInvite`: `invite/hour per team` (limit currently 30/hour)
  - `requestJoin`: `joinRequest/hour per user` (limit currently 10/hour)
  - `startOwnerTransfer`: starts/day per team (limit currently 5/day)
  - `markPayment`: `paymentMark/min per admin` (limit currently 10/min)

