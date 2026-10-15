# T01: Make authored Quests playable

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

An administrator creates or edits a Quest through the existing administration API and a learner can start, answer, and review those exact questions.

## Acceptance criteria

- [ ] Use one canonical persisted question/option representation for authoring and play; migrate existing JSON-authored questions without dropping existing normalized questions or breaking saved references.
- [ ] Validate nonempty question sets, unique question/option identities, valid answer references, and passing scores from 0 through 100.
- [ ] Update affected request/response contracts and the current Quest client; preserve compatibility for existing content during migration.
- [ ] Demonstrate create → learner start → submit → review with PostgreSQL, including an edit and an invalid question definition.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: G1; Content Creation and assessment foundation.
