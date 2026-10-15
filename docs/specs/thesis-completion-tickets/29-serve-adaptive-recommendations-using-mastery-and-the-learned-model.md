# Thesis 29: Serve adaptive recommendations using mastery and the learned model

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/146

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Learners receive learned next-activity recommendations that reflect mastery, recent performance, prerequisites, and suitable difficulty.

## Acceptance criteria

- [ ] Rank only approved eligible candidates, consume current mastery/progression, and record model/version provenance.
- [ ] Apply a documented difficulty policy and explain recommendations without claiming certainty about learner ability.
- [ ] Use the existing baseline as an explicitly labeled fallback on model outage, cold start, or incompatible artifacts.
- [ ] Update the recommendation screen and verify changing skill evidence changes eligible/ranked choices, and outages preserve usable learning.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #143 — Update and display mastery from the trained model
- #145 — Train and evaluate the activity recommender

## Further notes

Traceability: Adaptive Learning; ML Model 2 serving.
