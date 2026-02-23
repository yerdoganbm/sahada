# Firestore Schema (Authorization / Membership / Roles)

This document defines the **canonical, multi-tenant** Firestore data model used by the Authorization/Membership/Role engine.

## Goals / constraints

- **Firestore is source of truth**
- **Multi-tenant isolation is mandatory** (B2C + B2B simultaneously)
- **Backward compatible** with legacy user fields (`users.teamId`, `users.role`-like fields)
- **No privilege escalation**: all privileged mutations must be done via **Cloud Functions + transactions** with audit.

## Collections (top-level)

### `users/{uid}`

User profile + tenant selector.

- **`activeTeamId`**: `string | null` (new canonical selector)
- **`subscription`**: `'free'|'premium'|'partner'`
- **Legacy compatibility (keep, migrate away from reads)**:
  - **`teamId`**: `string | null`
  - **`role`**: legacy role string (e.g. `'admin'|'member'`)
  - **`isCaptain`**: `boolean`
- **Migration markers**:
  - **`authzMigrationVersion`**: `number` (monotonic)
  - **`authzMigrationAt`**: `timestamp`

### `teams/{teamId}`

- **`orgId`**: `string | null`
- **`ownerId`**: `string` (canonical single owner)
- **`joinPolicy`**: `'OPEN'|'APPROVAL'|'INVITE_ONLY'`
- **`tier`**: `'free'|'premium'|'partner'` (optional if you need per-team tiering)
- Other app fields: `name`, `shortName`, `inviteCode`, branding/colors, timestamps.

### `organizations/{orgId}`

- **`type`**: `'club'|'venue'|'federation'|...` (as per spec)
- **`tier`**: `'free'|'premium'|'partner'`
- Other org metadata and timestamps.

### `memberships/{membershipId}` (TEAM membership)

**Recommended id**: deterministic `membershipId = "${teamId}_${userId}"` to prevent duplicates.

- **`teamId`**: `string`
- **`orgId`**: `string | null` (denormalized from team for fast rules/queries)
- **`userId`**: `string`
- **`roleId`**: role id string (e.g. `TEAM_OWNER`, `TEAM_ADMIN`, `CAPTAIN`, `MEMBER`, `GUEST`, or custom)
- **`status`**: membership status enum
- **`version`**: `number` (monotonic, optimistic-lock in transactions)
- **Cooldown / enforcement metadata**:
  - **`leftAt`**: `timestamp | null`
  - **`rejectedAt`**: `timestamp | null`
  - **`banEnd`**: `timestamp | null` (TEMP_BANNED)
- **Role resurrection prevention**:
  - **`bannedRoleSnapshot`**: `roleId | null`
- **Audit references** (optional):
  - **`updatedAt`**, **`updatedBy`**
  - **`previousStatus`**

### `org_memberships/{orgMembershipId}` (ORG membership)

**Recommended id**: deterministic `orgMembershipId = "${orgId}_${userId}"`.

- **`orgId`**: `string`
- **`userId`**: `string`
- **`roleId`**: `ORG_OWNER|ORG_ADMIN|STAFF|VENUE_OWNER|...`
- (optional) `status`, `version`, timestamps, etc., if org membership also needs state machine.

### `invites/{inviteId}`

Invite/token flow (never store plaintext tokens).

- **`teamId`**: `string`
- **`inviterId`**: `string`
- **`target`**: `{ type: 'PHONE'|'EMAIL'|'USER_ID', value: string }`
- **`roleId`**: `string`
- **`tokenHash`**: `string` (hash of one-time token)
- **`expiresAt`**: `timestamp`
- **`status`**: `'INVITED'|'ACCEPTED'|'CANCELLED'|'INVITE_EXPIRED'`
- **`createdAt`**

### `payment_idempotency/{idempotencyKey}`

Idempotency guard for payment marking.

- **Doc id**: `sha256(matchId:userId:amount:dateBucket)`
- **`teamId`**: `string`
- **`matchId`**: `string`
- **`userId`**: `string`
- **`amount`**: `number`
- **`dateBucket`**: `YYYY-MM-DD`
- **`paymentId`**: `string`
- **`createdAt`**, **`createdBy`**

### `rate_limits/{id}`

Sliding window buckets for Cloud Functions rate limiting.

- **Doc id**: `${key}__${bucketStartMs}`
- **`key`**: string (e.g. `invite:{teamId}`, `joinRequest:{userId}`)
- **`bucketStartMs`**: number (epoch ms)
- **`windowSeconds`**: number
- **`count`**: number
- **`expiresAt`**: timestamp (TTL-style cleanup)
- **`createdAt`**, **`updatedAt`**

## Match capacity / waitlist (P2)

### `matches/{matchId}`

- **Hot fields** (counters, updated transactionally):
  - **`goingCount`**: number
  - **`waitlistCount`**: number
  - **`waitlistSeq`**: number (monotonic queue counter)
- Keep legacy:
  - **`attendees`**: array (legacy; will be phased out)

### `matches/{matchId}/participants/{userId}`

- **`userId`**: string
- **`state`**: `'GOING'|'WAITLIST'|'NOT_GOING'|'MAYBE'`
- **`createdAt`**, **`updatedAt`**

### `matches/{matchId}/waitlist/{userId}`

- **`userId`**: string
- **`queue`**: number (ordering key; from `matches.waitlistSeq`)
- **`createdAt`**: timestamp (ordering key)

### `join_requests/{requestId}`

Join request workflow.

- **`teamId`**: `string`
- **`userId`**: `string`
- **`status`**: `'REQUESTED'|'APPROVED'|'REJECTED'|'CANCELLED'`
- **`createdAt`**
- **`rejectedAt`** (for cooldown enforcement)

### `owner_transfers/{teamId}`

Two-phase owner transfer intent (single pending transfer per team).

- **Doc id**: `teamId` (enforces at most one pending intent per team)
- **`teamId`**: `string`
- **`currentOwnerId`**: `string`
- **`newOwnerId`**: `string`
- **`status`**: `'PENDING'|'CONFIRMED'|'CANCELLED'|'EXPIRED'` (note: current implementation deletes the intent on confirm)
- **`expiresAt`**: `timestamp`
- **`createdAt`**, **`createdBy`**
- **`updatedAt`**, **`updatedBy`**

### `audits/{auditId}` (append-only)

Immutable audit trail. **No updates/deletes**.

- **`at`**: `timestamp`
- **`actorId`**: `string`
- **`action`**: string (`MEMBERSHIP_STATUS_TRANSITION`, `ROLE_CHANGE`, `INVITE_CREATE`, ...)
- **`scope`**: `'TEAM'|'ORG'|'GLOBAL'`
- **`scopeId`**: `string` (teamId/orgId/global)
- **`target`**: `{ type: string, id: string }` (optional)
- **`decision`**: `{ allowed: boolean, reason: string }` (for authz allow/deny logging)
- **`meta`**: map (sanitized; never store secrets)

## CLI ile deploy (Firebase)

Proje kökünden:

```bash
# Sadece kurallar
firebase deploy --only firestore:rules

# Sadece indeksler (ilk seferde birkaç dakika sürebilir)
firebase deploy --only firestore:indexes

# Kurallar + indeksler
firebase deploy --only firestore
```

Kullanılan dosyalar (repo kökü): `firestore.rules`, `firestore.indexes.json`. `firebase.json` içinde `firestore.rules` ve `firestore.indexes` tanımlı.

## Required composite indexes

Composite indeksler `firestore.indexes.json` içinde tanımlı; tek alanlı sorgular (örn. `teams.orgId`, `invites.tokenHash`) Firestore tarafından otomatik indekslenir.

- **`memberships`**: `userId` + `status`
- **`memberships`**: `teamId` + `status`
- **`memberships`**: `status` + `banEnd` (scheduled temp-ban lift)
- **`memberships`**: `teamId` + `status` + `roleId` (invariants health check)
- **`teams`**: `orgId`
- **`invites`**: `status` + `expiresAt` (scheduled expiry)
- **`invites`**: `tokenHash`
- **`join_requests`**: `teamId` + `status`
- **`owner_transfers`**: `expiresAt` (optional, for scheduled cleanup)
- **`payment_idempotency`**: `teamId` + `createdAt` (optional, operational reporting)
- **`audits`**: `scopeId` + `at` (time)

