# T37: Verify a supportable thesis deployment

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Operators can deploy the existing application with correct origins and configuration, inspect readiness, and restore its data in a disposable environment.

## Acceptance criteria

- [ ] Record proposed response-time/concurrency, browser/device, accessibility, recovery, and service availability targets before measuring; distinguish thesis targets from unapproved production-scale claims.
- [ ] Validate required configuration, actual permitted web origins, readiness/dependency failures, and operational error reporting without exposing secrets or learner submissions.
- [ ] Exercise current identity and representative learning journeys, upstream timeout behavior, transport/database protection, and a backup/restore drill using disposable data.
- [ ] Record measurements and unresolved limits; wire relevant existing e2e/HTTP checks into CI without introducing a new browser runner solely for this ticket.
- [ ] Extend readiness checks in subsequent feature slices when ML/AI providers arrive; this ticket can ship against the current application and is not a dependency on every feature.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: Non-functional/data deployment requirements.

External prerequisite: Actual staging credentials/infrastructure and measured targets must be available before deployment claims can be completed; no uptime/geo-failover guarantee is implied.
