# T36: Show learner-authorized guidance analytics

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

A learner grants an instructor access to a bounded progress and competency summary, and the instructor can identify gaps until permission is revoked.

## Acceptance criteria

- [ ] Use trusted instructor capability and explicit learner-specific access grants with revocation; do not add classes, assignments, or gradebooks.
- [ ] Show completion, recent assessed performance, mastery/staleness, and learning gaps without raw private code or conversations.
- [ ] Provide a minimal grant/revoke flow and instructor summary screen with accessible empty/error states.
- [ ] Verify unauthorized instructors and revoked grants cannot access summaries, including cached/API paths, and that model outage is clearly represented.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T26: Update and display mastery from the trained model

## Further notes

Traceability: Retained instructor journey; no LMS scope.
