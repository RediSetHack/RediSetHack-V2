# T17: Complete a controlled artifact-based CTF

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Learners inspect an approved challenge artifact, submit a flag within explicit authorized boundaries, and receive a recorded accomplishment.

## Acceptance criteria

- [ ] Provide one real reviewed challenge with category/difficulty/skills and an artifact that does not require attacking any external target.
- [ ] Keep flag verification server-side; do not leak answer material through catalog, feedback, timing, or companion-accessible metadata.
- [ ] Persist learner-scoped attempts and completion with rate limits and exactly-once XP/event handling; apply eligibility checks.
- [ ] Add a small challenge page/result view and verify wrong/correct/replayed flags, ownership, and restricted artifact access.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T13: Record trustworthy learning interactions

## Further notes

Traceability: Capture the Flag Challenges; smallest controlled release.
