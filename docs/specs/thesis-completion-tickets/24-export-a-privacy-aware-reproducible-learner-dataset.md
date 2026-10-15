# Thesis 24: Export a privacy-aware reproducible learner dataset

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/141

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

An authorized researcher exports a validated versioned dataset from accepted interactions and receives a reproducible quality/split report.

## Acceptance criteria

- [ ] Define authorized access, research eligibility, retention, withdrawal/deletion exclusions, and pseudonymous identifiers; exclude direct identity and unnecessary raw code/chat.
- [ ] Export a bounded dataset with session/activity/skill/difficulty/version lineage and explicit missing-value handling.
- [ ] Produce reproducible learner/time-aware train/validation/test splits and report leakage, counts, labels, and exclusions.
- [ ] Provide a repeatable restricted command or admin operation and verify unauthorized access, deleted learner exclusion, deterministic splits, and no direct identifiers in outputs.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #127 — Honor Clerk account deletion locally
- #130 — Record trustworthy learning interactions

## Further notes

Traceability: Data preparation/privacy and both ML models.

External prerequisite: Real learner collection and the project-approved research/privacy protocol must exist before an export is used as thesis evidence; sanitized fixtures establish pipeline behavior only.
