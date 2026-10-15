# T12: Tag activities with competencies and difficulty

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Authors describe which programming/security skills an activity evaluates and learners can see its learning objectives and difficulty.

## Acceptance criteria

- [ ] Add a small explicit competency taxonomy and validated difficulty values, with stable IDs and activity/question associations.
- [ ] Allow existing administration APIs to assign/read these values without treating XP as difficulty or mastery.
- [ ] Expose learning objectives and difficulty in affected learner details through shared contracts.
- [ ] Verify author → persisted metadata → learner display and reject missing/foreign skill references; existing untagged content stays readable but is not silently used for mastery.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: Learner Mastery System and model inputs.
