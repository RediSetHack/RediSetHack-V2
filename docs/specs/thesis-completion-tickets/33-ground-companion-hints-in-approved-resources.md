# T33: Ground companion hints in approved resources

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

The companion answers with relevant approved educational passages and inspectable source references for the current activity.

## Acceptance criteria

- [ ] Ingest/index only approved versions with resource IDs, permissions, and a defined update/revocation path; use the smallest adequate retrieval implementation.
- [ ] Retrieve within learner authorization and current activity context, cite source versions, and state when no approved material supports an answer.
- [ ] Prevent retired/private material from being retrieved and treat retrieved instructions as untrusted content.
- [ ] Show citations in the companion panel and verify approval changes, cross-learner resources, irrelevant queries, and malicious embedded instructions.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T22: Review and publish a specific content revision, T32: Deliver activity-scoped companion conversations and graduated hints

## Further notes

Traceability: Retrieval-Augmented AI Companion.
