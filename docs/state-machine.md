# Membership State Machine

Canonical implementation:

- `mobile/src/domain/membershipStateMachine.ts`
- Transaction wrapper: `mobile/src/services/membershipTransitions.ts`

## States

- `INVITED`
- `INVITE_EXPIRED`
- `REQUESTED`
- `REQUEST_REJECTED`
- `ACTIVE`
- `SUSPENDED`
- `BANNED`
- `TEMP_BANNED`
- `LEFT`
- `TRANSFERRED`

## Transition rules

Transitions are defined in `TRANSITION_MATRIX` and validated by `validateTransition(...)`.

### Cooldowns

- `LEFT -> REQUESTED` only after **72h**
- `REQUEST_REJECTED -> REQUESTED` only after **24h**

### TEMP_BANNED expiry

- `TEMP_BANNED -> ACTIVE` only when `banEnd <= now` **or** `adminOverride=true` (must be authorized)

### Role resurrection prevention

On any transition into a blocked status (`SUSPENDED|BANNED|TEMP_BANNED`):

- snapshot live role into `bannedRoleSnapshot` (if not already present)
- set live `roleId = "NONE"`
- future authorization must **gate by status first**, then roles/permissions

### Versioning

- `membership.version` increments monotonically on every state change
- Transactions must update `version` and write an audit record atomically

