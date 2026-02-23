## Emulator concurrency tests (best-effort)

These scripts run **against the Firestore emulator** to stress-test the core transactional invariants:

- RSVP capacity + waitlist queue ordering
- Payment idempotency (double-submit safety)
- Invite single-use acceptance race

### Prereqs

- Node.js installed
- `functions/` dependencies installed:

```bash
cd functions
npm install
```

### Run

Start Firestore emulator (in another terminal):

```bash
npx firebase-tools emulators:start --only firestore --project demo-sahada
```

Then run the script:

```bash
cd functions
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/emulator/concurrency.mjs
```

Expected output:

- `OK: concurrency invariants passed`

### Notes

- This harness uses **Admin SDK** (emulator) and tests the **transactional invariants** directly.
- It does **not** validate Firestore Rules or Callable auth; those require Auth emulator + client SDK setup.

