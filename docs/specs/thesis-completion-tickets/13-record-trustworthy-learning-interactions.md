# Thesis 13: Record trustworthy learning interactions

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/130

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

An accepted Quest submission or reading completion produces one interpretable learning record and the learner can inspect recent activity.

## Acceptance criteria

- [ ] Persist stable event/session/activity/learner IDs, server timestamps, content version, skills, difficulty, answers/correctness, and the actual credited outcome.
- [ ] Distinguish reading completion from assessed success; never infer mastery from a completion button alone.
- [ ] Record measured session elapsed time with its definition and support later error/hint fields without manufacturing missing values.
- [ ] Expose a minimal own-activity history in the existing profile and prove replay/concurrency cannot duplicate the same event; another learner cannot read it.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #122 — Credit Quest XP atomically
- #129 — Tag activities with competencies and difficulty

## Further notes

Traceability: G8; Learner Interaction Logging.
