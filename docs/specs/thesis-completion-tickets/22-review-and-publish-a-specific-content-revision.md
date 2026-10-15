# Thesis 22: Review and publish a specific content revision

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/139

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

An administrator acting as moderator reviews a submission, records a decision, and publishes only the approved revision to learners.

## Acceptance criteria

- [ ] Add a queue and review actions for approve, reject, or request revision, with recorded reviewer/reason/timestamp.
- [ ] Expose only approved revisions to learner reads and new starts; keep a draft update from changing an approved version silently.
- [ ] Unpublishing revokes future discovery while preserving historical Results/accomplishments; enforce ownership/moderator checks on every action.
- [ ] Verify submitted → approved/rejected/revision-needed transitions and a real contributor → reviewer → learner journey.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #138 — Let approved contributors own and submit drafts

## Further notes

Traceability: Content Moderation and approved publication.
