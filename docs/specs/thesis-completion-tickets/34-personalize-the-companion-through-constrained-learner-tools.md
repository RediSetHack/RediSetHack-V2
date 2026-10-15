# T34: Personalize the companion through constrained learner tools

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

The companion can explain the learner's recent results, mastery, and eligible recommendations using controlled read-only platform tools.

## Acceptance criteria

- [ ] Expose only current approved activity content, learner mastery/history, eligible recommendations/Side Quests, and that learner's recorded code-execution results.
- [ ] Derive learner identity from authenticated context; validate tool arguments and reject arbitrary external requests or access to answer keys.
- [ ] Tools cannot grant XP, change roles, mark completion, or run arbitrary code; record bounded tool invocations and outcomes under the privacy policy.
- [ ] Present context-aware guidance and verify cross-learner calls, forbidden tool actions, missing/stale mastery, and model attempts to override authorization.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T29: Serve adaptive recommendations using mastery and the learned model, T32: Deliver activity-scoped companion conversations and graduated hints

## Further notes

Traceability: Agent Tools; Context-Aware AI Personalization.
