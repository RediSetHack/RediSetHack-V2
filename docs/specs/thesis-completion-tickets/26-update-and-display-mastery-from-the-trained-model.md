# T26: Update and display mastery from the trained model

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

A learner completes an assessment/activity, receives a versioned per-skill mastery estimate, and sees eligible skill-gated learning choices.

## Acceptance criteria

- [ ] Serve the evaluated artifact through an application port with bounded failure behavior and persisted model/feature/content lineage.
- [ ] Update mastery idempotently from accepted interactions and retain useful history; label unknown, stale, and assessment-only fallback values honestly.
- [ ] Display competency estimates in the baseline/profile interface and connect skill eligibility clauses to the same server decision.
- [ ] Verify two learners remain isolated, replay does not duplicate updates, artifact incompatibility fails safely, and inference outage does not prevent learning.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T14: Establish initial learner competency after onboarding, T18: Complete optional Side Quests with prerequisites, T25: Train and evaluate the first Learner Mastery Model

## Further notes

Traceability: Learner Mastery System; ML Model 1 serving.
