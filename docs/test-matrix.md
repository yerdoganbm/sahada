# Test Matrix — Authz / Membership / Role Engine

This matrix is meant to be used both for **manual testing** and as a guide for **unit/integration tests**.

## Authorization (`authorize(actor, resource, action, context)`)

### Positive

- **TEAM_ADMIN can invite**: `MEMBER_INVITE` allowed when membership `ACTIVE` + role `TEAM_ADMIN`
- **TEAM_OWNER inherits TEAM_ADMIN**: same permissions via inheritance DFS
- **ORG_ADMIN observer can read TEAM resources**: synthetic observer role grants `TEAM_READ` only

### Negative

- **Status gate**: `SUSPENDED/BANNED/TEMP_BANNED` denies before role evaluation
- **Cross-tenant isolation**: actor has no `teamRoles[teamId]` (and not org observer) → deny
- **Unknown permission id**: `authorize(..., action="SOME_UNKNOWN")` → deny

### Contextual / ABAC

- **CAPTAIN attendance manage requires `matchLive=true`**
- **VENUE_OWNER can only edit own venue** (`resource.ownerId == actor.uid`)
- **PAYMENT_APPROVE requires subscription != free**

## Membership state machine (`validateTransition`, `planMembershipTransition`)

### Positive

- `REQUESTED -> ACTIVE` allowed
- `ACTIVE -> TEMP_BANNED` allowed only with `banEnd`
- Blocked status transition snapshots role + forces role `NONE`

### Negative

- Invalid transitions rejected (e.g. `BANNED -> ACTIVE`)
- Cooldowns enforced:
  - `LEFT -> REQUESTED` before 72h → deny
  - `REQUEST_REJECTED -> REQUESTED` before 24h → deny
- `TEMP_BANNED -> ACTIVE` before `banEnd` without override → deny

## Invite + Join Request algorithms (transactions)

### Positive

- **Create invite** writes:
  - `invites/{id}` with `tokenHash`, `expiresAt`, status `INVITED`
  - membership stub `INVITED` for USER_ID target (if configured)
  - audit record

- **Accept invite** is one-time:
  - invite `INVITED -> ACCEPTED`
  - membership `INVITED -> ACTIVE`
  - user selectors updated

- **Request join OPEN**:
  - membership becomes `ACTIVE` (idempotent)

- **Request join APPROVAL**:
  - `join_requests/{teamId}_{uid}` `REQUESTED`
  - membership `REQUESTED`

- **Approve join request**:
  - join request `APPROVED`
  - membership `ACTIVE`

### Negative

- Accept expired invite → deny, invite marked `INVITE_EXPIRED`
- INVITE_ONLY team join without token → deny
- Attempt to approve/reject non-pending join request → deny

### Concurrency

- Two concurrent `requestJoin` calls → single join_request doc + consistent membership status
- Invite creation while join request exists → join request cancelled (superseded) + membership set to INVITED
- Two concurrent `acceptInvite` calls → exactly one succeeds, second fails with `invite_already_used`

## Owner transfer (two-phase commit)

### Positive

- Start transfer by current owner creates `owner_transfers/{teamId}` intent with 24h expiry
- Confirm by target updates:
  - `teams.ownerId`
  - old owner role → `TEAM_ADMIN`
  - new owner role → `TEAM_OWNER`
  - intent removed

### Negative

- Non-owner cannot start transfer (`abac:owner_transfer_start_requires_current_owner`)
- Non-target cannot confirm (`abac:owner_transfer_confirm_requires_target`)
- Expired intent cannot be confirmed

### Concurrency

- Two concurrent confirms (target double-submit) → exactly one commits; final state single owner

