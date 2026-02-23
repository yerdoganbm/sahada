# Sahada Authorization / Membership / Role Engine — Implementation Plan (Spec-aligned)

## Source of truth

- The authoritative architecture document path provided in the issue (`/mnt/data/sahada-mimari-tr.docx`) is **not available in this Cloud Agent VM** (no `/mnt/data` mount).  
- The implementation below is based on the **spec excerpt in the issue description** and the existing repo constraints.  
- To fully guarantee spec parity, add the `.docx` into the repo (e.g. `docs/sahada-mimari-tr.docx`) or mount it into the agent VM.

## Non‑negotiables (how we enforce them)

- **Single authorization entry point**: `mobile/src/domain/authorize.ts` (pure decision function).
- **Client checks = UX only**: the mobile app calls `authorize(...)` for user-friendly errors, but **real enforcement must be Firestore Rules + Cloud Functions (Admin SDK)**.
- **No privilege escalation**: transactions + monotonic `membership.version`, deterministic IDs, and “status gate before role checks”.
- **Multi‑tenant isolation**: all access is scoped by `teamId` / `orgId` and validated both in the decision engine and (later) in rules.

---

## Step-by-step plan (checkboxes)

### P0 — Discovery + domain foundation (no breaking changes)

- [x] **P0.0 Repo inventory** (paths + what they do)  
- [x] **P0.1 Canonical domain types** (`mobile/src/domain/model.ts`)  
- [x] **P0.2 Membership state machine** (`mobile/src/domain/membershipStateMachine.ts` + transactional transition in `mobile/src/services/membershipTransitions.ts`)  
- [x] **P0.3 Central authorization function** (`mobile/src/domain/authorize.ts` + `mobile/src/domain/roleRegistry.ts`)  
- [x] **P0.4 Firestore schema doc** (`docs/firestore-schema.md`)  
- [~] **P0.5 Migration algorithm** (bootstrapping exists in `AuthContext`, but join flow needed fixes)  
- [x] **P0.6 Minimal team switch UI** (`mobile/src/features/teamSwitch/TeamSwitchScreen.tsx`)

### P1 — Privileged mutations as safe algorithms (txn + idempotency)

- [x] **P1.1 Role resolution & precedence** (`mobile/src/domain/roleResolution.ts`)  
- [x] **P1.2 Membership transitions (txn + audit)** (`mobile/src/services/membershipTransitions.ts`)  
- [x] **P1.3 Invite vs Join Request (race-safe)**  
  - `mobile/src/services/inviteService.ts`  
  - `mobile/src/services/joinRequestService.ts`  
  - wired into `mobile/src/contexts/AuthContext.tsx` + `mobile/src/screens/JoinTeamScreen.tsx`
- [x] **P1.4 Owner transfer (two-phase commit)** (`mobile/src/services/ownerTransferService.ts`)  
- [ ] **P1.5 Payment idempotency keys** (`mobile/src/services/paymentService.ts`)  
- [ ] **P1.6 Rate limiting** (Cloud Functions design + client UX guard)

### P2 — Match capacity + waitlist (concurrency safe)

- [ ] **P2.1 Participants subcollection + counters**  
- [ ] **P2.2 RSVP txn algorithm** (`mobile/src/services/rsvpService.ts`)  
- [ ] **P2.3 Auto-promote waitlist**

### P3 — Production guardrails

- [x] **P3.1 Firestore Rules baseline** (`firestore.rules`)  
- [ ] **P3.2 Cloud Functions privileged mutations** (only if/when `functions/` exists)  
- [ ] **P3.3 Scheduled jobs** (invite expiry, temp ban lift, invariants checks)

### P4 — Tests + docs

- [x] **P4.1 Unit + concurrency tests** (domain + service-level where feasible)  
- [x] **P4.2 Manual test checklist** (`docs/manual-test-checklist.md`)  
- [x] **P4.3 Documentation set** (decision tree, state machine, tenant isolation, rate limits)

---

## P0.0 — Repo inventory (current state)

### Auth bootstrap

- `mobile/src/contexts/AuthContext.tsx`
  - Firestore-based “login” (`getUserByPhoneOrEmail`, `getUserById`)
  - Session persistence via `AsyncStorage`
  - Authz bootstrap/migration: `bootstrapMembershipState()` + `ensureLegacyMembership()` + `getActiveMembershipsForUser()`
  - Team switching: `switchActiveTeam()`

- `mobile/src/App.tsx`
  - App root; wires providers/navigation.

### Firestore services

- `mobile/src/services/firestore.ts`
  - Primary Firestore data access layer (users/teams/matches/venues/payments/transactions/reservations/polls)
  - Canonical `memberships` collection helpers (new model)
  - Legacy fields still read/written (`users.teamId`, `users.role`, etc.)

- `mobile/src/services/firestore.web.ts`
  - Web SDK version of the same Firestore access layer (for web preview/simulator use).

### Team creation + join flows

- `mobile/src/screens/TeamSetupScreen.tsx`
  - Calls `AuthContext.createTeamAndLogin()` → `createTeamAndUser()` (Firestore)

- `mobile/src/screens/JoinTeamScreen.tsx`
  - Previously: join by `teams.inviteCode` and only updated `users.teamId` (risk: missing membership)
  - Now: uses canonical join algorithm via `AuthContext.joinTeam()` (invite token preferred, else join policy)

- Join requests usage (legacy vs new)
  - Legacy “player proposal” join-requests: `mobile/src/services/joinRequests.ts` + `firestore.ts` join_requests helpers + `mobile/src/screens/MemberManagementScreen.tsx`
  - Canonical membership join-requests (new engine): `mobile/src/services/joinRequestService.ts` (teamId+userId+status)

### Match / payment models (current)

- Matches: `mobile/src/services/matches.ts` → `firestore.ts`
  - `matches/{matchId}` has `attendees: []` array (single-doc write hot spot; P2 will move to subcollections)

- Finance/payments: `mobile/src/services/finance.ts` → `firestore.ts`
  - `payments`, `transactions`, `reservations` collections (no idempotency keys yet; P1.5)

---

## P0.1 — Canonical domain types (spec mirror)

- **Created/exists**: `mobile/src/domain/model.ts`
- **Manual verification**:
  - Types: `Scope`, `RoleId`, `PermissionId`, `Role`, `Permission`, `Actor`, `Resource`, `Context`
  - Enums: `MembershipStatus`, team roles, org roles
  - Helpers: `isTerminalStatus()`, `isBlockedStatus()`

---

## P0.2 — Membership state machine (transitions + cooldowns + versioning)

### Files

- `mobile/src/domain/membershipStateMachine.ts`
- `mobile/src/services/membershipTransitions.ts`

### Code

- Transition matrix: `TRANSITION_MATRIX`
- Validator: `validateTransition(...)`
- Transaction wrapper: `transitionMembership(...)` (writes audit in same tx)

### Manual test checklist

- Transition ACTIVE → LEFT; verify `leftAt` set and `version` increments
- Transition LEFT → REQUESTED within 72h; expect denial (`COOLDOWN_ACTIVE`)
- Transition TEMP_BANNED → ACTIVE before `banEnd`; expect denial unless admin override

---

## P0.3 — Central authorization (RBAC + ABAC + isolation)

### Files

- `mobile/src/domain/authorize.ts`
- `mobile/src/domain/roleRegistry.ts`
- `mobile/src/domain/roleResolution.ts`

### Manual test checklist

- With TEAM_ADMIN membership ACTIVE:
  - `MEMBER_INVITE` allowed
- With membership status BANNED:
  - any action denied with `membership_blocked:*`

---

## P0.4 — Firestore schema + required composite indexes

### Files

- `docs/firestore-schema.md`

### Manual check

- Ensure composite indexes from the doc exist in Firestore (Console or `firestore.indexes.json` when added)

---

## P0.5 — Legacy → canonical migration (no breaking)

### Files

- `mobile/src/contexts/AuthContext.tsx` (`bootstrapMembershipState`)
- `mobile/src/services/firestore.ts` (`ensureLegacyMembership`, `getActiveMembershipsForUser`, `updateUserAuthzFields`)

### Manual test checklist

- Existing legacy user has `users.teamId` but no `memberships/{teamId}_{uid}`
  - Login
  - Expect membership created as `ACTIVE`, activeTeamId set, migration marker set

---

## P0.6 — Multi-team selector UI

### Files

- `mobile/src/features/teamSwitch/TeamSwitchScreen.tsx`

### Manual test checklist

- With 2 ACTIVE memberships:
  - switching active team updates `users/{uid}.activeTeamId` (and legacy `teamId` for compatibility)

---

## P1.3 — Invite vs Join Request (race-safe) — what was implemented

### Files created/edited

- **Created**
  - `mobile/src/services/inviteService.ts`
  - `mobile/src/services/joinRequestService.ts`
  - `mobile/src/services/authz.ts` (client-side UX gate; single entry point remains `domain/authorize.ts`)
  - `mobile/src/utils/token.ts` (token generation + `sha256Hex`)
  - `mobile/src/services/audit.ts` (non-transactional helper; transactional audits are written inside txs in P1.3 services)

- **Edited**
  - `mobile/src/contexts/AuthContext.tsx`
    - Join now creates canonical membership via `requestJoin(...)` or `acceptInvite(...)`
    - Keeps legacy `users.teamId` synchronized on team switch for backwards compatibility
  - `mobile/src/screens/JoinTeamScreen.tsx`
    - UX messaging for `ACTIVE` vs `REQUESTED`

### Exact code (where to look)

- Invite creation/acceptance:
  - `mobile/src/services/inviteService.ts`
    - `createInvite(...)` — transactional invite + (optional) membership stub
    - `acceptInvite(...)` — transactional one-time consumption + membership ACTIVE + user selector update

- Join request workflow:
  - `mobile/src/services/joinRequestService.ts`
    - `requestJoin(...)` — OPEN (auto-join) vs APPROVAL (REQUESTED) vs INVITE_ONLY (deny)
    - `approveJoinRequest(...)` / `rejectJoinRequest(...)` — transactional state + audit

### Manual test checklist (P1.3)

- Join by legacy team code (OPEN teams)
  - Create a team
  - From another existing user, go to “Takıma Katıl”, enter `teams.inviteCode`
  - Expect: membership doc `memberships/{teamId}_{uid}` becomes `ACTIVE`, and `users/{uid}.activeTeamId` updates

- Join request (APPROVAL teams)
  - Set `teams/{teamId}.joinPolicy = "APPROVAL"`
  - Request join by code
  - Expect: `join_requests/{teamId}_{uid}` status `REQUESTED`, membership status `REQUESTED`

- Invite token acceptance
  - Call `createInvite(...)` to produce a token (currently via service call / dev tooling)
  - Accept using that token in “Takıma Katıl”
  - Expect: invite becomes `ACCEPTED`, membership becomes `ACTIVE`, selectors update

- Race safety
  - While user submits join request, create an invite for the same user/team
  - Expect: join request is cancelled (superseded) and membership moves to `INVITED`

---

## P1.4 — Owner transfer (two-phase commit)

### Files created/edited

- **Created**
  - `mobile/src/services/ownerTransferService.ts`

- **Edited**
  - `mobile/src/domain/roleRegistry.ts` (new permissions: `TEAM_OWNER_TRANSFER_START`, `TEAM_OWNER_TRANSFER_CONFIRM`)
  - `mobile/src/domain/authorize.ts` (ABAC: only current owner can start; only target can confirm)
  - `mobile/src/services/authz.ts` (support `resourceOwnerId` for ABAC checks)
  - `mobile/src/services/firestore.ts` (team creation now sets `teams.ownerId` and founder membership role `TEAM_OWNER`)
  - `docs/firestore-schema.md` (added `owner_transfers/{teamId}`)

### Exact code (where to look)

- `mobile/src/services/ownerTransferService.ts`
  - `startOwnerTransfer(...)`:
    - creates/overwrites `owner_transfers/{teamId}` with `expiresAt` (24h default)
    - writes audit `OWNER_TRANSFER_START`
    - bootstraps legacy teams missing `teams.ownerId` by setting it to the starter
  - `confirmOwnerTransfer(...)`:
    - verifies intent exists + not expired + target matches
    - transactional update:
      - `teams.ownerId = newOwnerId`
      - old owner role → `TEAM_ADMIN`
      - new owner role → `TEAM_OWNER`
      - deletes intent
    - writes audit `OWNER_TRANSFER_CONFIRM`

### Manual test checklist

- Seed a team with a valid owner:
  - Create a new team (should set `teams.ownerId` and founder membership `TEAM_OWNER`)
- Start transfer (owner user):
  - Call `startOwnerTransfer({ teamId, currentOwnerId, newOwnerId })`
  - Expect: `owner_transfers/{teamId}` exists with status `PENDING` and valid `expiresAt`
- Confirm transfer (target user):
  - Call `confirmOwnerTransfer({ teamId, newOwnerId })`
  - Expect:
    - `teams.ownerId == newOwnerId`
    - old owner membership role `TEAM_ADMIN`
    - new owner membership role `TEAM_OWNER`
    - transfer intent doc deleted

---

## P3.1 — Firestore Rules baseline (guardrail)

### Files

- `firestore.rules` (production baseline; requires Firebase Auth)
- `mobile/firestore.rules` (legacy permissive rules for development; do not use in prod)

### Manual test checklist

- With authenticated user and ACTIVE membership:
  - reading `teams/{teamId}` allowed
- Without membership:
  - reading `teams/{teamId}` denied

---

## P4.1 — Unit tests (where feasible)

### Files

- `mobile/jest.config.js`
- `mobile/src/domain/__tests__/authorize.test.ts`
- `mobile/src/domain/__tests__/roleRegistry.test.ts`
- `mobile/src/domain/__tests__/membershipStateMachine.test.ts`

### How to run

- From `mobile/`:
  - `npm test`

