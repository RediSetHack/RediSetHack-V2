# Thesis 10: Honor Clerk account deletion locally

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/127

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Deleting a Clerk account removes its active local presence and prevents stale provisioning events from resurrecting it.

## Acceptance criteria

- [ ] Handle signed user-deletion events idempotently and define ordering/replay behavior against delayed create/update events.
- [ ] Remove or anonymize personal learning records according to a documented deletion policy and remove the user from profiles/leaderboards.
- [ ] Preserve only the minimum deletion marker needed for safe ordering; exclude deleted identities from future research exports.
- [ ] Exercise duplicate/out-of-order signed events with persisted data and verify old authenticated requests cannot restore the deleted account.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately).

## Further notes

Traceability: User Account Management and research privacy.
