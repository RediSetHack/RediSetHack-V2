# T03: Make Badge definitions and repeat awards reliable

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

An administrator defines valid milestones and learners receive the intended Badge count even when qualifying activities finish together.

## Acceptance criteria

- [ ] Validate exact cumulative, activity, and category criteria, including Zone identity for category completion and supported targets.
- [ ] Persist a unique award milestone or equivalent transactional protection without removing ADR-0003 repeat awards.
- [ ] Make evaluation retryable after an activity commits, with a demonstrable recovery path for missed awards.
- [ ] Exercise each admin-defined trigger through real qualifying activity data and concurrent evaluation; profile counts match stored distinct awards.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: G3, G6; Badge and Achievement System.
