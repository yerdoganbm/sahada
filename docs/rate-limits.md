# Rate Limits (Design)

Rate limiting must be enforced **server-side** (Cloud Functions) and only mirrored on the client for UX.

## Keys and windows (spec)

- `teamCreate/day` (per actor)
- `invite/hour` (per team)
- `joinRequest/hour` (per user)
- `matchCreate/day` (per team or per actor)
- `paymentMark/min` (per admin)

## Algorithm

- Sliding window counter stored in Firestore:
  - `rate_limits/{key}` where key encodes scope (e.g. `invite:{teamId}:{hourBucket}`)
- For high write rates, use **sharded counters**:
  - `rate_limits/{key}/shards/{n}` incremented by random shard id

## Enforcement flow (Cloud Function)

- Compute rate-limit key for the request
- Transactionally:
  - read current window counter(s)
  - reject if limit exceeded
  - increment counter and proceed with the privileged mutation
- Write an audit record for allow/deny

