# Tenant Isolation (B2C + B2B)

## Tenants

- **TEAM tenant**: isolated by `teamId`
- **ORG tenant**: isolated by `orgId`
- **GLOBAL**: platform-wide operations (restricted)

## Isolation invariants

- A user must not read/write any TEAM/ORG data unless:
  - they have an **ACTIVE membership** in that tenant, **or**
  - they have an **ORG admin/owner observer** role granting **read-only** access to teams in that org

## Enforcement layers

- **Decision engine**: `mobile/src/domain/authorize.ts`
  - denies cross-tenant access via `teamRoles`/`orgRoles` maps and observer checks

- **Firestore Rules (guardrail)**: `firestore.rules`
  - must enforce the same constraints (server-side)

- **Cloud Functions (privileged mutations)**:
  - use Admin SDK transactions
  - call `authorize(...)` as the single decision entry point
  - write audits for allow/deny on privileged actions

## Data model support

- `memberships/{teamId}_{userId}` is deterministic to prevent duplicates
- `memberships.orgId` is denormalized for fast rules (optional but recommended)

