# T29: Serve adaptive recommendations using mastery and the learned model

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Learners receive learned next-activity recommendations that reflect mastery, recent performance, prerequisites, and suitable difficulty.

## Acceptance criteria

- [ ] Rank only approved eligible candidates, consume current mastery/progression, and record model/version provenance.
- [ ] Apply a documented difficulty policy and explain recommendations without claiming certainty about learner ability.
- [ ] Use the existing baseline as an explicitly labeled fallback on model outage, cold start, or incompatible artifacts.
- [ ] Update the recommendation screen and verify changing skill evidence changes eligible/ranked choices, and outages preserve usable learning.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T26: Update and display mastery from the trained model, T28: Train and evaluate the activity recommender

## Further notes

Traceability: Adaptive Learning; ML Model 2 serving.
