# Thesis 28: Train and evaluate the activity recommender

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/145

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Researchers reproduce a learned recommendation artifact and report held-out ranking results against the logged baseline.

## Acceptance criteria

- [ ] Extend the versioned dataset export to include recommendation exposure/selection/outcome records without leaking future outcomes into features.
- [ ] Specify target/negative examples, eligibility-aware candidate evaluation, split policy, baseline, and ranking/coverage metrics before the run.
- [ ] Train one small learned model and emit an artifact plus held-out comparison with data sparsity and bias limitations.
- [ ] Verify reproducibility, artifact reload, and that reported improvements come from held-out data rather than synthetic fixtures or training metrics.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #141 — Export a privacy-aware reproducible learner dataset
- #144 — Offer eligible baseline recommendations and record outcomes

## Further notes

Traceability: ML Model 2.

External prerequisite: A sufficiently usable approved recommendation/outcome dataset is required for a defensible result; collect it after baseline recommendations ship.
