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

## Provider isolation gate

The API fails closed unless `CODE_EXECUTION_SANDBOX_VERIFIED=true`. Set it only
after verifying the configured Piston deployment in an authorized disposable
environment: confirm per-process CPU and memory limits, execution timeout, no
network access from learner programs, and cleanup of the execution container
after both success and timeout. The public default endpoint has not been
verified by this repository; keep the gate false when using it.
