# T32: Deliver activity-scoped companion conversations and graduated hints

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Learners ask the adapted companion for help on their current activity and receive progressively detailed hints with persistent attempt-scoped history.

## Acceptance criteria

- [ ] Add authenticated conversation/inference integration with bounded context, timeout, quotas, cancellation/error feedback, and conversation isolation.
- [ ] Persist hint escalation per learner/activity attempt so a new chat cannot reset the policy; do not inject answer keys or hidden tests into learner context.
- [ ] Start with conceptual guidance, then targeted hints; make any further solution-disclosure boundary explicit and default to withholding complete answers for active assessed work.
- [ ] Render a minimal accessible companion panel; record hint usage with accepted interactions and verify replays, cross-learner denial, failed provider calls, and escalation behavior.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T13: Record trustworthy learning interactions, T31: Adapt and evaluate the companion model

## Further notes

Traceability: Graduated AI Hint System; Companion serving.
