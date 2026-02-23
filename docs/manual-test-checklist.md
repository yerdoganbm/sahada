# Manual Test Checklist — Authorization / Membership / Role Engine

This checklist is designed to be run with **two devices/accounts** (or two simulators) to cover **race conditions**.

## Setup prerequisites

- Firestore has collections from `docs/firestore-schema.md` (`users`, `teams`, `memberships`, `join_requests`, `invites`, `audits`, ...).
- At least **2 existing users** in `users/` (until Firebase Auth + signup is implemented).
- Team `joinPolicy` set explicitly on `teams/{teamId}` for each scenario: `OPEN`, `APPROVAL`, `INVITE_ONLY`.

## P0 — Legacy compatibility / migration

- [ ] **Login migration (legacy)**:
  - Given `users/{uid}.teamId` exists and `authzMigrationVersion` missing/0
  - Login
  - Expect: `memberships/{teamId}_{uid}` created as `ACTIVE`, `authzMigrationVersion` becomes 1, `activeTeamId` set

- [ ] **Team switch**:
  - Given user has 2 ACTIVE memberships
  - Switch active team
  - Expect: `users/{uid}.activeTeamId` updates (and legacy `teamId` updated for backwards compatibility)

## P1.3 — Join / invite flows

### OPEN policy

- [ ] **Join by team inviteCode (success)**:
  - `teams/{teamId}.joinPolicy = "OPEN"`
  - User enters `teams.inviteCode`
  - Expect:
    - `memberships/{teamId}_{uid}` is `ACTIVE`
    - `users/{uid}.activeTeamId == teamId`
    - Audit entry exists (`JOIN_OPEN_POLICY`)

- [ ] **Idempotent join**:
  - Same user repeats join with same code
  - Expect: no duplicate membership; still `ACTIVE`

### APPROVAL policy

- [ ] **Request join creates join_request + membership REQUESTED**:
  - `teams/{teamId}.joinPolicy = "APPROVAL"`
  - User enters `teams.inviteCode`
  - Expect:
    - `join_requests/{teamId}_{uid}.status == "REQUESTED"`
    - `memberships/{teamId}_{uid}.status == "REQUESTED"`

- [ ] **Approve join request**:
  - Admin approves pending request
  - Expect:
    - `join_requests/{id}.status == "APPROVED"`
    - `memberships/{teamId}_{uid}.status == "ACTIVE"`
    - Audit entry exists (`JOIN_REQUEST_APPROVE`)

- [ ] **Reject join request**:
  - Admin rejects pending request
  - Expect:
    - `join_requests/{id}.status == "REJECTED"`
    - `memberships/{teamId}_{uid}.status == "REQUEST_REJECTED"`
    - Audit entry exists (`JOIN_REQUEST_REJECT`)

### INVITE_ONLY policy

- [ ] **Join by team inviteCode denied**:
  - `teams/{teamId}.joinPolicy = "INVITE_ONLY"`
  - User enters `teams.inviteCode`
  - Expect: join denied (no `ACTIVE` membership created)

- [ ] **Invite token acceptance allowed**:
  - Create an invite token for the user
  - User enters token
  - Expect: membership `ACTIVE`, invite `ACCEPTED`

## Concurrency / race tests

- [ ] **Double submit join request** (same user, two devices):
  - Both submit join simultaneously
  - Expect: single `join_requests/{teamId}_{uid}` doc, single membership doc, no inconsistent status

- [ ] **Invite creation vs join request** (two devices):
  - Device A: user requests join (`APPROVAL`)
  - Device B: admin creates invite for same user/team at same time
  - Expect: join request becomes `CANCELLED`, membership becomes `INVITED`, invite exists

- [ ] **Double accept invite** (two devices):
  - Both attempt to accept same token
  - Expect: only one succeeds; invite ends as `ACCEPTED` and membership ends as `ACTIVE`

