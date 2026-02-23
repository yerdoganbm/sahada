# Cloud Functions Plan (Privileged Mutations + Scheduled Jobs)

This repo contains a **Cloud Functions skeleton** under `functions/`. The plan below describes the intended production shape and what remains.

## Principles

- Use **Admin SDK** (bypasses Firestore rules) with **Firestore transactions**
- Treat `authorize(actor, resource, action, context)` as the **single authorization entry point**
- Write an **audit record** for **allow and deny** on privileged actions
- Enforce **rate limits** server-side
- Ensure **idempotency** for external side effects (payments, owner transfers, invite acceptance)

## HTTPS callable (recommended) / HTTPS endpoints

### Membership / roles

- `transitionMembershipStatus(teamId, userId, nextStatus, meta)`
  - Validates state machine + bumps `version`
  - Writes membership + audit atomically

- `changeMemberRole(teamId, userId, roleId)`
  - Requires `MEMBER_ROLE_CHANGE`
  - Prevent escalation: cannot assign a role higher than caller’s maximum
  - Writes audit

### Invites / join requests

- `createInvite(teamId, target, roleId, ttlHours?)`
  - Requires `MEMBER_INVITE`
  - Generates secure token server-side
  - Stores `tokenHash` only
  - Writes audit

- `acceptInvite(token)`
  - Hashes token, finds invite by `tokenHash`
  - One-time use + TTL enforcement
  - Sets membership ACTIVE (txn) + updates selectors
  - Writes audit

- `requestJoin(teamId)`
  - Allowed for signed-in users
  - Applies team `joinPolicy`
  - OPEN: activate membership in txn
  - APPROVAL: create join_request + membership REQUESTED
  - INVITE_ONLY: deny
  - Writes audit (allow/deny)

- `approveJoinRequest(requestId)` / `rejectJoinRequest(requestId)`
  - Requires `MEMBER_APPROVE_JOIN`
  - Txn: update join_request + membership + audit

### Owner transfer

- `startOwnerTransfer(teamId, newOwnerId)`
- `confirmOwnerTransfer(teamId, tokenOrIntentId)`
  - Two-phase commit (intent doc with 24h TTL)
  - Txn to swap roles + update `teams.ownerId`
  - Audit

### Payments

- `markPayment(matchId, userId, amount, proofUrl?)`
  - Requires `PAYMENT_MARK`
  - Idempotency key: `sha256(matchId:userId:amount:dateBucket)`
  - Txn: payment + idempotency doc
  - Audit

- `approvePayment(paymentId)`
  - Requires `PAYMENT_APPROVE` + premium ABAC gate
  - Txn + audit

## Scheduled jobs

- `expireInvites` (every 15 min)
  - INVITED → INVITE_EXPIRED where `expiresAt <= now`

- `liftTempBans` (every 5 min)
  - TEMP_BANNED → ACTIVE where `banEnd <= now`

- `invariantsHealthCheck` (every 15 min)
  - DEG-01: each team has exactly 1 ACTIVE OWNER
  - No duplicate ACTIVE membership for `(teamId,userId)`
  - Audit append-only integrity checks

## Repo implementation status

- **Implemented skeleton**: `functions/src/index.ts`
  - `createInvite`, `acceptInvite`, `requestJoin`, `approveJoinRequest`
  - `startOwnerTransfer`, `confirmOwnerTransfer`
  - `markPayment`, `approvePayment`
- **Centralized authz reuse**:
  - `functions/src/authz.ts` wraps `authorize(...)` by importing from `mobile/src/domain/*`

