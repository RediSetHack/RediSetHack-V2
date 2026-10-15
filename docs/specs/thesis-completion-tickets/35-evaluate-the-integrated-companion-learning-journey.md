# T35: Evaluate the integrated companion learning journey

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Researchers and maintainers can demonstrate whether the served companion follows the approved tutoring rubric across actual learning scenarios.

## Acceptance criteria

- [ ] Run a versioned scenario suite covering programming, debugging, secure coding, narration, graduated hints, retrieval citations, and learner-specific context.
- [ ] Include answer-leakage, retrieved prompt-injection, private-data, forbidden-action, provider-failure, and escalation-reset cases.
- [ ] Report model/resource/tool versions, deterministic control outcomes, measured rubric results, and unresolved failures; fixes remain within the failing feature slice.
- [ ] Demonstrate one learner journey from failed activity through assistance to a new attempt with hint usage correctly recorded; do not claim improved educational outcomes without a study.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T33: Ground companion hints in approved resources, T34: Personalize the companion through constrained learner tools

## Further notes

Traceability: Integrated AI Companion acceptance.

External prerequisite: Requires the evaluated adapted artifact and approved rubric; external model nondeterminism must be reported rather than hidden by exact-text assertions.
