# T25: Train and evaluate the first Learner Mastery Model

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Researchers can reproduce a trained competency/performance estimator and compare its held-out predictions with a documented baseline.

## Acceptance criteria

- [ ] Record the target, feature definitions, learner/time split, baseline, metrics, random seeds, and dataset version before evaluating.
- [ ] Train one appropriately small model from permitted interaction data and emit a versioned artifact and machine-readable report.
- [ ] Report predictive quality and calibration with sample limitations; do not equate XP, a rule score, or fixture outputs with a trained model.
- [ ] Verify artifact reload and feature compatibility, and report held-out results honestly without tuning on the test partition.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T24: Export a privacy-aware reproducible learner dataset

## Further notes

Traceability: ML Model 1.

External prerequisite: Completion as thesis evidence requires a usable approved dataset and available compute; inadequate samples must be reported, not replaced with fabricated results.
