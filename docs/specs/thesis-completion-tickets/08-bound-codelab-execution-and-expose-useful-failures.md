# Thesis 08: Bound Codelab execution and expose useful failures

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/125

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Learners can run supported programs and receive bounded success, compilation, runtime, timeout, and unavailable-provider feedback.

## Acceptance criteria

- [ ] Validate provider responses including compile-only failures; distinguish execution timing from request duration and learner elapsed time.
- [ ] Add explicit request timeout and learner-scoped request/concurrency limits appropriate to the configured execution provider.
- [ ] Verify provider sandbox resource/network restrictions in a disposable authorized environment; fail closed if required isolation cannot be established.
- [ ] Update current Codelab output/loading/error states and exercise supported languages, malformed responses, timeout, and compile-only errors at the provider and HTTP boundaries.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately).

## Further notes

Traceability: G11; Interactive Programming Environment.
