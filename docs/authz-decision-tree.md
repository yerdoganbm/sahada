# Authorization Decision Tree (RBAC + ABAC + Tenant Isolation)

This document describes the **canonical evaluation order** implemented by `mobile/src/domain/authorize.ts`.

## Inputs

- **Actor**: identity + roles + membership statuses + subscription tier
- **Resource**: `{ type, id, teamId?, orgId?, ownerId? }`
- **Action**: `PermissionId` (string) — must exist in the permission catalog
- **Context**: time + match flags + request/session metadata

## Evaluation order (must not be reordered)

1) **Membership status gate**  
   - If the actor’s membership status for the resource tenant is `BANNED|SUSPENDED|TEMP_BANNED` → **DENY**

2) **Global override**  
   - If `actor.globalRole == PLATFORM_ADMIN` → **ALLOW** (requires audit)

3) **Resolve role for the resource scope**  
   - TEAM resources require TEAM role  
   - ORG roles do **not** grant TEAM mutations  
   - ORG_OWNER/ORG_ADMIN get a synthetic **read-only observer** for teams in their org

4) **Expand permissions**  
   - DFS through role inheritance graph, deduped

5) **RBAC check**  
   - Required permission must exist in expanded permission set → else **DENY**

6) **ABAC check**  
   - Context/resource attributes constrain allowed operations

7) **Cross-tenant isolation**  
   - Deny if the team/org is not present in the actor maps (observer rules apply)

8) **Return allow/deny + reason**

## Notes

- “Client-side checks” are **UX-only**. Real enforcement must be implemented in Firestore Rules + Cloud Functions.

