# T06: Enforce Stage eligibility on every learner route

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Locked Stage content and attached Quests stay inaccessible until the learner meets the existing predecessor rule, with consistent explanations.

## Acceptance criteria

- [ ] Do not include restricted Lesson bodies in locked Stage listings; preserve non-sensitive catalog metadata and lock reason.
- [ ] Enforce parent Stage access when starting and submitting attached Quests as well as when reading/completing a Lesson.
- [ ] Reuse the same eligibility decision across relevant endpoints and keep the web locked state aligned with server responses.
- [ ] Verify direct-route and alternate-route access, missing prerequisites, completed predecessors, and two distinct learners through HTTP.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: G7; prerequisites.
