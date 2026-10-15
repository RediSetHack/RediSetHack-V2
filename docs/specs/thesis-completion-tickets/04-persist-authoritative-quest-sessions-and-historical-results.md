# Thesis 04: Persist authoritative Quest Sessions and historical Results

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/121

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Learners start a timed Quest, submit once, resume the recorded session where supported, and review the questions they actually answered.

## Acceptance criteria

- [ ] Persist session owner, assessed content version/snapshot, server start/deadline, and terminal outcome; permit explicit new-session retakes.
- [ ] Require a valid owned session for submission; validate response membership and reject duplicate question references.
- [ ] Keep the current countdown consistent with server deadlines; define expiry as no credit after deadline, and do not silently grant a grace period or trust a client clock.
- [ ] Return the recorded Result on identical transport replay; conflicting second submissions cannot change it. Preserve question snapshots after edits.
- [ ] Verify expiry, ownership, replay, edits, and retry behavior through HTTP with PostgreSQL and the existing web Quest-state tests.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #118 — Make authored Quests playable

## Further notes

Traceability: G4, G9; assessment and interaction foundations.
