# Thesis 32: Deliver activity-scoped companion conversations and graduated hints

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/149

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Learners ask the adapted companion for help on their current activity and receive progressively detailed hints with persistent attempt-scoped history.

## Acceptance criteria

- [ ] Add authenticated conversation/inference integration with bounded context, timeout, quotas, cancellation/error feedback, and conversation isolation.
- [ ] Persist hint escalation per learner/activity attempt so a new chat cannot reset the policy; do not inject answer keys or hidden tests into learner context.
- [ ] Start with conceptual guidance, then targeted hints; make any further solution-disclosure boundary explicit and default to withholding complete answers for active assessed work.
- [ ] Render a minimal accessible companion panel; record hint usage with accepted interactions and verify replays, cross-learner denial, failed provider calls, and escalation behavior.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #130 — Record trustworthy learning interactions
- #148 — Adapt and evaluate the companion model

## Further notes

Traceability: Graduated AI Hint System; Companion serving.
