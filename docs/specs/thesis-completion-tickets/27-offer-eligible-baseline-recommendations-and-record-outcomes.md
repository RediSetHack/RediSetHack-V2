# Thesis 27: Offer eligible baseline recommendations and record outcomes

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/144

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Learners can choose a next eligible activity from a transparent baseline list and the platform records recommendation exposure and outcomes.

## Acceptance criteria

- [ ] Generate a small deterministic baseline from approved activities and existing skill/progress/eligibility metadata; explicitly label it as a baseline.
- [ ] Display recommendations and a useful reason; never recommend a restricted or unpublished activity.
- [ ] Persist recommendation identity, candidate/version context, exposure, selection, and linked completion with replay protection.
- [ ] Verify eligibility, empty candidates, two learners, and exposure → selection → accepted activity linkage through the learner flow.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #123 — Enforce Stage eligibility on every learner route
- #130 — Record trustworthy learning interactions
- #139 — Review and publish a specific content revision

## Further notes

Traceability: Recommendation data collection and usable fallback; not completion of ML Model 2.
