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

### `join_requests/{requestId}`

Join request workflow.

- **`teamId`**: `string`
- **`userId`**: `string`
- **`status`**: `'REQUESTED'|'APPROVED'|'REJECTED'|'CANCELLED'`
- **`createdAt`**
- **`rejectedAt`** (for cooldown enforcement)

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

## Required composite indexes

Create these in Firestore (Console or `firestore.indexes.json` when added):

- **`memberships`**: `userId` + `status`
- **`memberships`**: `teamId` + `status`
- **`teams`**: `orgId`
- **`invites`**: `tokenHash`
- **`join_requests`**: `teamId` + `status`
- **`audits`**: `scopeId` + `at` (time)

