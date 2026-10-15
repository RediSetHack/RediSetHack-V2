# Thesis 09: Make onboarding identity synchronization trustworthy

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/126

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

A newly registered learner reaches Character selection using verified identity data even when optional token claims are missing.

## Acceptance criteria

- [ ] Use Clerk-verified claims or authenticated provider lookup as the authority for email; do not trust an arbitrary client email override.
- [ ] Specify and enforce DTO behavior under global whitelisting; keep existing email when an update has no replacement.
- [ ] Preserve Character choice, XP, and Clerk ID across repeated syncs; surface a retryable onboarding error when trusted identity data cannot be obtained.
- [ ] Exercise the actual HTTP validation path, incomplete claims, forged body fields, and repeated sync; smoke-check the current onboarding consumer.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately).

## Further notes

Traceability: User Account Management; audit validation finding.
