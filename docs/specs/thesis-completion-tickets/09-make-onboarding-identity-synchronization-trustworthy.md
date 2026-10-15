# T09: Make onboarding identity synchronization trustworthy

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

A newly registered learner reaches Character selection using verified identity data even when optional token claims are missing.

## Acceptance criteria

- [ ] Use Clerk-verified claims or authenticated provider lookup as the authority for email; do not trust an arbitrary client email override.
- [ ] Specify and enforce DTO behavior under global whitelisting; keep existing email when an update has no replacement.
- [ ] Preserve Character choice, XP, and Clerk ID across repeated syncs; surface a retryable onboarding error when trusted identity data cannot be obtained.
- [ ] Exercise the actual HTTP validation path, incomplete claims, forged body fields, and repeated sync; smoke-check the current onboarding consumer.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately)

## Further notes

Traceability: User Account Management; audit validation finding.
