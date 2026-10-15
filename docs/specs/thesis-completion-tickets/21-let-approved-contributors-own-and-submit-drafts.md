# T21: Let approved contributors own and submit drafts

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

An approved contributor creates and revises their own Novel material in a small authoring flow and submits a particular revision for review.

## Acceptance criteria

- [ ] Authorize contributor capability through trusted identity metadata; preserve Clerk Dashboard administration.
- [ ] Persist ownership and draft/revision/submitted states, with compatible Lesson/activity schemas and parent-child consistency.
- [ ] Provide a minimal contributor draft editor/list and validation feedback; do not expose drafts through learner APIs.
- [ ] Verify owner edit/submit, another contributor denial, concurrent revision conflicts, and submitted-revision immutability.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T11: Deliver the first resumable Novel and chapters

## Further notes

Traceability: Content Creation; new community surface only.
