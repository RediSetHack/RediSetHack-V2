# T14: Establish initial learner competency after onboarding

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

After Character selection a learner completes a designated assessment and sees a saved baseline of assessed skills and gaps.

## Acceptance criteria

- [ ] Designate an assessment with competency-tagged questions and retain its version and assessment-completed state.
- [ ] Use the existing Quest Session flow; failed network retries resume or recover the same outcome rather than creating new baselines.
- [ ] Compute a transparent initial per-skill baseline and label unassessed skills; explicitly label it as assessment-based rather than a trained ML estimate.
- [ ] Connect onboarding, assessment, and baseline presentation, and verify incomplete/complete/retake behavior and authenticated ownership.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T09: Make onboarding identity synchronization trustworthy, T13: Record trustworthy learning interactions

## Further notes

Traceability: Initial Learner Assessment; competency foundation.
